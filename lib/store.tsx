"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { createClient } from "./supabase/client";
import { ThemeId } from "./themes";
import { Prenda, Look, AnalisisGuardado, PostPropio, WishItem, Categoria } from "./data";
import type { User } from "@supabase/supabase-js";

interface Perfil {
  nombre: string;
  estilo: string;
  premium: boolean;
  onboarded: boolean;
  username: string;
  bio: string;
  foto: string | null;
  notificaciones: boolean;
  privado: boolean;
  idioma: "es" | "en";
  modoOscuro: boolean;
}

interface Store {
  user: User | null;
  perfil: Perfil;
  setPerfil: (p: Partial<Perfil>) => void;
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
  prendas: Prenda[];
  addPrenda: (p: Prenda) => void;
  updatePrenda: (id: string, cambios: Partial<Prenda>) => void;
  removePrenda: (id: string) => void;
  looks: Look[];
  addLook: (l: Look) => void;
  removeLook: (id: string) => void;
  historial: AnalisisGuardado[];
  addAnalisis: (a: AnalisisGuardado) => void;
  misPosts: PostPropio[];
  addPost: (p: PostPropio) => void;
  removePost: (id: string) => void;
  seguidos: string[];
  toggleSeguir: (usuarioId: string) => void;
  followersCount: number;
  solicitudesEnviadas: string[];
  solicitudesRecibidas: SolicitudRecibida[];
  solicitarSeguir: (usuarioId: string) => void;
  cancelarSolicitud: (usuarioId: string) => void;
  aceptarSolicitud: (usuarioId: string) => void;
  rechazarSolicitud: (usuarioId: string) => void;
  wishlist: WishItem[];
  addWish: (w: WishItem) => void;
  removeWish: (id: string) => void;
  tableros: Tablero[];
  addTablero: (nombre: string) => Promise<string | null>;
  renameTablero: (id: string, nombre: string) => void;
  removeTablero: (id: string) => void;
  setTableroPrivado: (id: string, privado: boolean) => void;
  guardarEnTablero: (tableroId: string, postId: string) => void;
  quitarDeTablero: (tableroId: string, postId: string) => void;
  ready: boolean;
}

const DEFAULT_PERFIL: Perfil = {
  nombre: "",
  estilo: "",
  premium: false,
  onboarded: true,
  username: "",
  bio: "",
  foto: null,
  notificaciones: true,
  privado: false,
  idioma: "es",
  modoOscuro: false,
};

export interface Tablero {
  id: string;
  nombre: string;
  privado: boolean;
}

export interface SolicitudRecibida {
  id: string;
  username: string;
  nombre: string;
  foto: string | null;
}

const Ctx = createContext<Store | null>(null);

/* ── Conversores fila BD ↔ tipos de la app ── */

function dbToPrenda(r: any): Prenda {
  return {
    id: r.id,
    nombre: r.nombre,
    categoria: r.categoria as Categoria,
    color: r.color || "—",
    estilo: r.estilo || "—",
    imagen: r.imagen_url,
    ultimoUso: r.ultimo_uso || undefined,
    favorito: r.favorito || false,
    usos: r.usos || 0,
  };
}

function dbToLook(r: any): Look {
  return { id: r.id, nombre: r.nombre, prendaIds: r.prenda_ids || [], creado: r.creado_en };
}

function dbToAnalisis(r: any): AnalisisGuardado {
  return { id: r.id, fecha: r.creado_en, compra: !!r.compra, resumen: r.resumen || "", imagen: r.imagen_url };
}

function dbToPost(r: any): PostPropio {
  return {
    id: r.id,
    imagen: r.imagen_url,
    titulo: r.titulo,
    descripcion: r.descripcion || "",
    prendaIds: r.prenda_ids || [],
    likes: r.likes_count ?? 0,
    fecha: r.creado_en,
  };
}

function dbToWish(r: any): WishItem {
  return { id: r.id, imagen: r.imagen_url, nota: r.nota || "", fecha: r.creado_en };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfilState] = useState<Perfil>(DEFAULT_PERFIL);
  const [theme, setThemeState] = useState<ThemeId>("signature");
  const [prendas, setPrendas] = useState<Prenda[]>([]);
  const [looks, setLooks] = useState<Look[]>([]);
  const [historial, setHistorial] = useState<AnalisisGuardado[]>([]);
  const [misPosts, setMisPosts] = useState<PostPropio[]>([]);
  const [seguidos, setSeguidos] = useState<string[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [solicitudesEnviadas, setSolicitudesEnviadas] = useState<string[]>([]);
  const [solicitudesRecibidas, setSolicitudesRecibidas] = useState<SolicitudRecibida[]>([]);
  const [wishlist, setWishlist] = useState<WishItem[]>([]);
  const [tableros, setTableros] = useState<Tablero[]>([]);
  const [ready, setReady] = useState(false);

  /* ── Comprimir imagen a máx 900px para subidas rápidas y fiables ── */
  const comprimir = (dataUrl: string): Promise<Blob> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const max = 900;
        let { width, height } = img;
        if (width > max || height > max) {
          const f = Math.min(max / width, max / height);
          width = Math.round(width * f);
          height = Math.round(height * f);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("compress"))),
          "image/jpeg",
          0.85
        );
      };
      img.onerror = reject;
      img.src = dataUrl;
    });

  /* ── Subir una imagen (dataURL) a Storage y devolver su URL pública ── */
  const subirImagen = useCallback(
    async (dataUrl: string | null): Promise<string | null> => {
      if (!dataUrl || !dataUrl.startsWith("data:") || !user) return dataUrl;
      try {
        const blob = await comprimir(dataUrl).catch(async () => (await fetch(dataUrl)).blob());
        const ruta = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
        const { error } = await supabase.storage.from("dresse").upload(ruta, blob, {
          contentType: blob.type || "image/jpeg",
        });
        if (error) return null;
        const { data } = supabase.storage.from("dresse").getPublicUrl(ruta);
        return data.publicUrl;
      } catch {
        return null;
      }
    },
    [user, supabase]
  );

  /* ── Cargar todo al iniciar sesión ── */
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (!data.user) setReady(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelado = false;

    async function cargar() {
      const uid = user!.id;
      const [pf, pr, lk, hi, po, sg, fc, wl, se, sr, tb] = await Promise.all([
        supabase.from("perfiles").select("*").eq("id", uid).single(),
        supabase.from("prendas").select("*").eq("usuario_id", uid).eq("archivada", false).order("creada_en", { ascending: false }),
        supabase.from("looks").select("*").eq("usuario_id", uid).order("creado_en", { ascending: false }),
        supabase.from("historial_asesor").select("*").eq("usuario_id", uid).order("creado_en", { ascending: false }).limit(5),
        supabase.from("posts").select("*").eq("usuario_id", uid).order("creado_en", { ascending: false }),
        supabase.from("seguidores").select("seguido_id").eq("seguidor_id", uid),
        supabase.from("seguidores").select("seguidor_id", { count: "exact", head: true }).eq("seguido_id", uid),
        supabase.from("wishlist").select("*").eq("usuario_id", uid).order("creado_en", { ascending: false }),
        supabase.from("solicitudes").select("seguido_id").eq("seguidor_id", uid),
        supabase.from("solicitudes").select("seguidor_id").eq("seguido_id", uid),
        supabase.from("tableros").select("*").eq("usuario_id", uid).order("creado_en"),
      ]);

      if (cancelado) return;

      // Si el perfil no existe (fallo del trigger en el registro), crearlo
      if (!pf.data) {
        const base = (user!.email || "dresse").split("@")[0];
        const username =
          base.toLowerCase().replace(/[^a-z0-9]/g, "") + uid.slice(0, 4);
        await supabase.from("perfiles").insert({
          id: uid,
          nombre: base,
          username,
        });
        pf.data = { id: uid, nombre: base, username } as any;
      }

      if (pf.data) {
        setPerfilState({
          nombre: pf.data.nombre || "",
          estilo: pf.data.estilo || "",
          premium: !!pf.data.premium,
          onboarded: true,
          username: pf.data.username || "",
          bio: pf.data.bio || "",
          foto: pf.data.foto_url,
          notificaciones: pf.data.notificaciones ?? true,
          privado: !!pf.data.privado,
          idioma: (pf.data.idioma as "es" | "en") || "es",
          modoOscuro: !!pf.data.modo_oscuro,
        });
        if (pf.data.tema) setThemeState(pf.data.tema as ThemeId);
      }
      if (pr.data) setPrendas(pr.data.map(dbToPrenda));
      if (lk.data) setLooks(lk.data.map(dbToLook));
      if (hi.data) setHistorial(hi.data.map(dbToAnalisis));
      if (po.data) setMisPosts(po.data.map((r) => dbToPost({ ...r, likes_count: r.likes })));
      if (sg.data) setSeguidos(sg.data.map((r: any) => r.seguido_id));
      setFollowersCount(fc.count || 0);
      if (wl.data) setWishlist(wl.data.map(dbToWish));
      if (se.data) setSolicitudesEnviadas(se.data.map((r: any) => r.seguido_id));
      if (tb.data)
        setTableros(
          tb.data.map((r: any) => ({ id: r.id, nombre: r.nombre, privado: !!r.privado }))
        );

      // Solicitudes recibidas: cargar los perfiles de quienes piden seguirte
      if (sr.data && sr.data.length) {
        const ids = sr.data.map((r: any) => r.seguidor_id);
        const { data: perfs } = await supabase
          .from("perfiles")
          .select("id, username, nombre, foto_url")
          .in("id", ids);
        setSolicitudesRecibidas(
          (perfs || []).map((p: any) => ({
            id: p.id,
            username: p.username || "dresse",
            nombre: p.nombre || "",
            foto: p.foto_url,
          }))
        );
      }
      // Detección de idioma del dispositivo (solo la primera vez)
      try {
        if (!localStorage.getItem("dresse.idioma.detectado")) {
          localStorage.setItem("dresse.idioma.detectado", "1");
          const idiomaMovil = navigator.language?.slice(0, 2);
          if (idiomaMovil && idiomaMovil !== "es" && (pf.data as any)?.idioma !== "en") {
            setPerfilState((prev) => ({ ...prev, idioma: "en" }));
            supabase.from("perfiles").update({ idioma: "en" }).eq("id", uid).then(() => {});
          }
        }
      } catch {}

      setReady(true);
    }

    cargar();
    return () => {
      cancelado = true;
    };
  }, [user]);

  /* ── Tema y modo oscuro sobre el documento ── */
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  useEffect(() => {
    document.documentElement.dataset.mode = perfil.modoOscuro ? "dark" : "light";
  }, [perfil.modoOscuro]);

  /* ── Perfil ── */
  const setPerfil = (p: Partial<Perfil>) => {
    setPerfilState((prev) => ({ ...prev, ...p }));
    if (!user) return;

    (async () => {
      const cambios: Record<string, any> = {};
      if (p.nombre !== undefined) cambios.nombre = p.nombre;
      if (p.estilo !== undefined) cambios.estilo = p.estilo;
      if (p.premium !== undefined) cambios.premium = p.premium;
      if (p.username !== undefined) cambios.username = p.username;
      if (p.bio !== undefined) cambios.bio = p.bio;
      if (p.notificaciones !== undefined) cambios.notificaciones = p.notificaciones;
      if (p.privado !== undefined) cambios.privado = p.privado;
      if (p.idioma !== undefined) cambios.idioma = p.idioma;
      if (p.modoOscuro !== undefined) cambios.modo_oscuro = p.modoOscuro;
      if (p.foto !== undefined) {
        const url = await subirImagen(p.foto);
        if (url) {
          cambios.foto_url = url;
          setPerfilState((prev) => ({ ...prev, foto: url }));
        } else {
          // La subida falló: no tocar la foto guardada y avisar
          alert("No se pudo subir la foto. Inténtalo de nuevo.");
          const { data } = await supabase.from("perfiles").select("foto_url").eq("id", user.id).single();
          setPerfilState((prev) => ({ ...prev, foto: data?.foto_url || null }));
        }
      }
      if (Object.keys(cambios).length) {
        await supabase.from("perfiles").update(cambios).eq("id", user.id);
      }
    })();
  };

  const setTheme = (t: ThemeId) => {
    setThemeState(t);
    if (user) supabase.from("perfiles").update({ tema: t }).eq("id", user.id).then(() => {});
  };

  /* ── Prendas ── */
  const addPrenda = (p: Prenda) => {
    if (!user) return;
    (async () => {
      const imagen_url = await subirImagen(p.imagen);
      const { data } = await supabase
        .from("prendas")
        .insert({
          usuario_id: user.id,
          nombre: p.nombre,
          categoria: p.categoria,
          color: p.color,
          estilo: p.estilo,
          imagen_url,
          ultimo_uso: p.ultimoUso || null,
          usos: 0,
        })
        .select()
        .single();
      if (data) setPrendas((prev) => [dbToPrenda(data), ...prev]);
    })();
  };

  const updatePrenda = (id: string, cambios: Partial<Prenda>) => {
    setPrendas((prev) => prev.map((p) => (p.id === id ? { ...p, ...cambios } : p)));
    if (!user) return;
    const db: Record<string, any> = {};
    if (cambios.nombre !== undefined) db.nombre = cambios.nombre;
    if (cambios.categoria !== undefined) db.categoria = cambios.categoria;
    if (cambios.color !== undefined) db.color = cambios.color;
    if (cambios.estilo !== undefined) db.estilo = cambios.estilo;
    if (cambios.ultimoUso !== undefined) db.ultimo_uso = cambios.ultimoUso;
    if (cambios.favorito !== undefined) db.favorito = cambios.favorito;
    if (cambios.usos !== undefined) db.usos = cambios.usos;
    if (Object.keys(db).length) {
      supabase.from("prendas").update(db).eq("id", id).then(() => {});
    }
  };

  const removePrenda = (id: string) => {
    setPrendas((prev) => prev.filter((p) => p.id !== id));
    // Quitarla de los looks que la incluyan
    setLooks((prev) => {
      const afectados = prev.filter((l) => l.prendaIds.includes(id));
      afectados.forEach((l) => {
        const nuevas = l.prendaIds.filter((pid) => pid !== id);
        if (nuevas.length === 0) {
          supabase.from("looks").delete().eq("id", l.id).then(() => {});
        } else {
          supabase.from("looks").update({ prenda_ids: nuevas }).eq("id", l.id).then(() => {});
        }
      });
      return prev
        .map((l) => ({ ...l, prendaIds: l.prendaIds.filter((pid) => pid !== id) }))
        .filter((l) => l.prendaIds.length > 0);
    });
    supabase.from("prendas").delete().eq("id", id).then(() => {});
  };

  /* ── Looks ── */
  const addLook = (l: Look) => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("looks")
        .insert({ usuario_id: user.id, nombre: l.nombre, prenda_ids: l.prendaIds })
        .select()
        .single();
      if (data) setLooks((prev) => [dbToLook(data), ...prev]);
    })();
  };

  const removeLook = (id: string) => {
    setLooks((prev) => prev.filter((l) => l.id !== id));
    supabase.from("looks").delete().eq("id", id).then(() => {});
  };

  /* ── Historial del asesor ── */
  const addAnalisis = (a: AnalisisGuardado) => {
    if (!user) return;
    (async () => {
      const imagen_url = await subirImagen(a.imagen);
      const { data } = await supabase
        .from("historial_asesor")
        .insert({ usuario_id: user.id, compra: a.compra, resumen: a.resumen, imagen_url })
        .select()
        .single();
      if (data) setHistorial((prev) => [dbToAnalisis(data), ...prev].slice(0, 5));
    })();
  };

  /* ── Posts propios ── */
  const addPost = (p: PostPropio) => {
    if (!user) return;
    (async () => {
      const imagen_url = await subirImagen(p.imagen);
      const { data } = await supabase
        .from("posts")
        .insert({
          usuario_id: user.id,
          titulo: p.titulo,
          descripcion: p.descripcion,
          imagen_url,
          prenda_ids: p.prendaIds,
          estilo: perfil.estilo || null,
        })
        .select()
        .single();
      if (data) setMisPosts((prev) => [dbToPost(data), ...prev]);
    })();
  };

  const removePost = (id: string) => {
    setMisPosts((prev) => prev.filter((p) => p.id !== id));
    supabase.from("posts").delete().eq("id", id).then(() => {});
  };

  /* ── Seguidores ── */
  const toggleSeguir = (usuarioId: string) => {
    if (!user || usuarioId === user.id) return;
    if (seguidos.includes(usuarioId)) {
      setSeguidos((prev) => prev.filter((u) => u !== usuarioId));
      supabase
        .from("seguidores")
        .delete()
        .eq("seguidor_id", user.id)
        .eq("seguido_id", usuarioId)
        .then(() => {});
    } else {
      setSeguidos((prev) => [...prev, usuarioId]);
      supabase
        .from("seguidores")
        .insert({ seguidor_id: user.id, seguido_id: usuarioId })
        .then(() => {});
    }
  };

  /* ── Solicitudes de seguimiento (cuentas privadas) ── */
  const solicitarSeguir = (usuarioId: string) => {
    if (!user || usuarioId === user.id) return;
    setSolicitudesEnviadas((prev) => [...prev, usuarioId]);
    supabase
      .from("solicitudes")
      .insert({ seguidor_id: user.id, seguido_id: usuarioId })
      .then(() => {});
  };

  const cancelarSolicitud = (usuarioId: string) => {
    if (!user) return;
    setSolicitudesEnviadas((prev) => prev.filter((u) => u !== usuarioId));
    supabase
      .from("solicitudes")
      .delete()
      .eq("seguidor_id", user.id)
      .eq("seguido_id", usuarioId)
      .then(() => {});
  };

  const aceptarSolicitud = (usuarioId: string) => {
    if (!user) return;
    setSolicitudesRecibidas((prev) => prev.filter((s) => s.id !== usuarioId));
    setFollowersCount((n) => n + 1);
    (async () => {
      await supabase
        .from("seguidores")
        .insert({ seguidor_id: usuarioId, seguido_id: user.id });
      await supabase
        .from("solicitudes")
        .delete()
        .eq("seguidor_id", usuarioId)
        .eq("seguido_id", user.id);
    })();
  };

  const rechazarSolicitud = (usuarioId: string) => {
    if (!user) return;
    setSolicitudesRecibidas((prev) => prev.filter((s) => s.id !== usuarioId));
    supabase
      .from("solicitudes")
      .delete()
      .eq("seguidor_id", usuarioId)
      .eq("seguido_id", user.id)
      .then(() => {});
  };

  /* ── Tableros (Pinterest) ── */
  const addTablero = async (nombre: string): Promise<string | null> => {
    if (!user || !nombre.trim()) return null;
    const { data } = await supabase
      .from("tableros")
      .insert({ usuario_id: user.id, nombre: nombre.trim() })
      .select()
      .single();
    if (data) {
      setTableros((prev) => [...prev, { id: data.id, nombre: data.nombre, privado: false }]);
      return data.id;
    }
    return null;
  };

  const renameTablero = (id: string, nombre: string) => {
    setTableros((prev) => prev.map((t) => (t.id === id ? { ...t, nombre } : t)));
    supabase.from("tableros").update({ nombre }).eq("id", id).then(() => {});
  };

  const removeTablero = (id: string) => {
    setTableros((prev) => prev.filter((t) => t.id !== id));
    supabase.from("tableros").delete().eq("id", id).then(() => {});
  };

  const setTableroPrivado = (id: string, privado: boolean) => {
    setTableros((prev) => prev.map((t) => (t.id === id ? { ...t, privado } : t)));
    supabase.from("tableros").update({ privado }).eq("id", id).then(() => {});
  };

  const guardarEnTablero = (tableroId: string, postId: string) => {
    supabase.from("tablero_posts").insert({ tablero_id: tableroId, post_id: postId }).then(() => {});
  };

  const quitarDeTablero = (tableroId: string, postId: string) => {
    supabase
      .from("tablero_posts")
      .delete()
      .eq("tablero_id", tableroId)
      .eq("post_id", postId)
      .then(() => {});
  };

  /* ── Wishlist ── */
  const addWish = (w: WishItem) => {
    if (!user) return;
    (async () => {
      const imagen_url = await subirImagen(w.imagen);
      const { data } = await supabase
        .from("wishlist")
        .insert({ usuario_id: user.id, nota: w.nota, imagen_url })
        .select()
        .single();
      if (data) setWishlist((prev) => [dbToWish(data), ...prev]);
    })();
  };

  const removeWish = (id: string) => {
    setWishlist((prev) => prev.filter((w) => w.id !== id));
    supabase.from("wishlist").delete().eq("id", id).then(() => {});
  };

  return (
    <Ctx.Provider
      value={{
        user,
        perfil,
        setPerfil,
        theme,
        setTheme,
        prendas,
        addPrenda,
        updatePrenda,
        removePrenda,
        looks,
        addLook,
        removeLook,
        historial,
        addAnalisis,
        misPosts,
        addPost,
        removePost,
        seguidos,
        toggleSeguir,
        followersCount,
        solicitudesEnviadas,
        solicitudesRecibidas,
        solicitarSeguir,
        cancelarSolicitud,
        aceptarSolicitud,
        rechazarSolicitud,
        wishlist,
        addWish,
        removeWish,
        tableros,
        addTablero,
        renameTablero,
        removeTablero,
        setTableroPrivado,
        guardarEnTablero,
        quitarDeTablero,
        ready,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore debe usarse dentro de StoreProvider");
  return ctx;
}
