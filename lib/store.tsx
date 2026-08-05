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
import { BUCKET, firmarRutas, firmarUna, resolver } from "./almacen";
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
  /**
   * Último fallo al guardar en la nube, o null. Antes estos errores se
   * tragaban en silencio y la usuaria creía haber guardado algo que se había
   * perdido. Lo pinta <AvisoError/> desde el layout.
   */
  avisoError: string | null;
  limpiarAviso: () => void;
}

const DEFAULT_PERFIL: Perfil = {
  nombre: "",
  estilo: "",
  premium: false,
  // Siempre true hasta que la base de datos diga lo contrario: así la
  // bienvenida no puede aparecer de golpe mientras el perfil aún carga.
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
  const [avisoError, setAvisoError] = useState<string | null>(null);

  const limpiarAviso = useCallback(() => setAvisoError(null), []);

  /** Avisar de un fallo al guardar, en vez de tragárselo */
  const fallo = useCallback((accion: string) => {
    setAvisoError(`No se pudo ${accion}. Revisa tu conexión e inténtalo otra vez.`);
  }, []);

  /**
   * Envoltorio de toda escritura contra Supabase. Devuelve true si fue bien.
   * Existe porque estas llamadas se hacían con `.then(() => {})`, que descarta
   * el error: si Supabase rechazaba un guardado, la pantalla seguía mostrando
   * el cambio y el dato no existía en ninguna parte.
   */
  const escribir = useCallback(
    async (
      accion: string,
      op: PromiseLike<{ error: { message: string } | null }>
    ): Promise<boolean> => {
      try {
        const { error } = await op;
        if (error) {
          console.error(`[Dressé] fallo al ${accion}:`, error.message);
          fallo(accion);
          return false;
        }
        return true;
      } catch (e) {
        console.error(`[Dressé] fallo al ${accion}:`, e);
        fallo(accion);
        return false;
      }
    },
    [fallo]
  );

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

  /**
   * Sube una imagen al almacén.
   *
   * DE MOMENTO sigue devolviendo la dirección pública, que es lo que se
   * guarda en la base de datos. El objetivo es guardar solo la ruta, pero
   * mientras comunidad, perfil y los perfiles públicos no firmen sus fotos,
   * cambiarlo dejaría rotas las imágenes nuevas en esas pantallas.
   *
   * Cuando todas firmen: devolver `ruta` en vez de la dirección y cerrar el
   * almacén (`public = false`). `rutaDe` ya entiende las dos formas, así que
   * las filas antiguas seguirán funcionando sin migrar nada.
   */
  const subirImagen = useCallback(
    async (dataUrl: string | null): Promise<string | null> => {
      if (!dataUrl || !dataUrl.startsWith("data:") || !user) return dataUrl;
      try {
        const blob = await comprimir(dataUrl).catch(async () => (await fetch(dataUrl)).blob());
        const ruta = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
        const { error } = await supabase.storage.from(BUCKET).upload(ruta, blob, {
          contentType: blob.type || "image/jpeg",
        });
        if (error) return null;
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(ruta);
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

      // Si el perfil no existe (fallo del trigger en el registro), crearlo.
      // Se relee la fila creada para quedarnos con los valores por defecto
      // reales de la base de datos (entre ellos onboarded).
      if (!pf.data) {
        const base = (user!.email || "dresse").split("@")[0];
        const username =
          base.toLowerCase().replace(/[^a-z0-9]/g, "") + uid.slice(0, 4);
        const { data: creado } = await supabase
          .from("perfiles")
          .insert({ id: uid, nombre: base, username })
          .select()
          .single();
        pf.data = creado ?? ({ id: uid, nombre: base, username } as any);
      }

      // Firmar de una vez todas las fotos de esta carga. Lo que hay guardado
      // en la base de datos es una ruta (o una dirección pública antigua), y
      // ninguna de las dos sirve ya para pintar: hay que firmarlas.
      const firmas = await firmarRutas(supabase, [
        pf.data?.foto_url,
        ...(pr.data || []).map((r: any) => r.imagen_url),
        ...(hi.data || []).map((r: any) => r.imagen_url),
        ...(po.data || []).map((r: any) => r.imagen_url),
        ...(wl.data || []).map((r: any) => r.imagen_url),
      ]);
      const foto = (v: any) => resolver(firmas, v);

      if (pf.data) {
        setPerfilState({
          nombre: pf.data.nombre || "",
          estilo: pf.data.estilo || "",
          premium: !!pf.data.premium,
          // Si la columna aún no existe en Supabase llega undefined: se asume
          // true y la bienvenida sencillamente no se muestra.
          onboarded: pf.data.onboarded ?? true,
          username: pf.data.username || "",
          bio: pf.data.bio || "",
          foto: foto(pf.data.foto_url),
          notificaciones: pf.data.notificaciones ?? true,
          privado: !!pf.data.privado,
          idioma: (pf.data.idioma as "es" | "en") || "es",
          modoOscuro: !!pf.data.modo_oscuro,
        });
        if (pf.data.tema) setThemeState(pf.data.tema as ThemeId);
      }
      if (pr.data)
        setPrendas(pr.data.map((r: any) => dbToPrenda({ ...r, imagen_url: foto(r.imagen_url) })));
      if (lk.data) setLooks(lk.data.map(dbToLook));
      if (hi.data)
        setHistorial(hi.data.map((r: any) => dbToAnalisis({ ...r, imagen_url: foto(r.imagen_url) })));
      if (po.data)
        setMisPosts(
          po.data.map((r: any) =>
            dbToPost({ ...r, likes_count: r.likes, imagen_url: foto(r.imagen_url) })
          )
        );
      if (sg.data) setSeguidos(sg.data.map((r: any) => r.seguido_id));
      setFollowersCount(fc.count || 0);
      if (wl.data)
        setWishlist(wl.data.map((r: any) => dbToWish({ ...r, imagen_url: foto(r.imagen_url) })));
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
        const firmasSol = await firmarRutas(
          supabase,
          (perfs || []).map((p: any) => p.foto_url)
        );
        setSolicitudesRecibidas(
          (perfs || []).map((p: any) => ({
            id: p.id,
            username: p.username || "dresse",
            nombre: p.nombre || "",
            foto: resolver(firmasSol, p.foto_url),
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
            // Nadie ha pedido esto: si falla se registra pero no se molesta a
            // la usuaria. Como mucho, se volverá a detectar en otro momento.
            supabase
              .from("perfiles")
              .update({ idioma: "en" })
              .eq("id", uid)
              .then(({ error }) => {
                if (error) console.error("[Dressé] no se pudo guardar el idioma:", error.message);
              });
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
      if (p.onboarded !== undefined) cambios.onboarded = p.onboarded;
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
          // Firmar para poder enseñarla ya; en la base de datos va la ruta.
          const fotoFirmada = await firmarUna(supabase, url);
          setPerfilState((prev) => ({ ...prev, foto: fotoFirmada }));
        } else {
          // La subida falló: no tocar la foto guardada y avisar con el mismo
          // aviso que el resto de la app, en vez del cuadro del navegador.
          fallo("subir la foto");
          const { data } = await supabase.from("perfiles").select("foto_url").eq("id", user.id).single();
          setPerfilState((prev) => ({ ...prev, foto: data?.foto_url || null }));
        }
      }
      if (Object.keys(cambios).length) {
        await escribir(
          "guardar tu perfil",
          supabase.from("perfiles").update(cambios).eq("id", user.id)
        );
      }
    })();
  };

  const setTheme = (t: ThemeId) => {
    setThemeState(t);
    if (user) {
      escribir(
        "guardar el tema",
        supabase.from("perfiles").update({ tema: t }).eq("id", user.id)
      );
    }
  };

  /* ── Prendas ── */
  const addPrenda = (p: Prenda) => {
    if (!user) return;
    (async () => {
      const imagen_url = await subirImagen(p.imagen);
      const { data, error } = await supabase
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
      // Antes, si esto fallaba, la prenda no aparecía y nadie decía por qué.
      if (error || !data) {
        console.error("[Dressé] fallo al guardar la prenda:", error?.message);
        fallo("guardar la prenda");
        return;
      }
      const fotoPrenda = await firmarUna(supabase, data.imagen_url);
      setPrendas((prev) => [dbToPrenda({ ...data, imagen_url: fotoPrenda }), ...prev]);
    })();
  };

  const updatePrenda = (id: string, cambios: Partial<Prenda>) => {
    const anterior = prendas.find((p) => p.id === id);
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
      (async () => {
        const ok = await escribir(
          "guardar los cambios de la prenda",
          supabase.from("prendas").update(db).eq("id", id)
        );
        // Deshacer el cambio en pantalla si no llegó a guardarse
        if (!ok && anterior) {
          setPrendas((prev) => prev.map((p) => (p.id === id ? anterior : p)));
        }
      })();
    }
  };

  const removePrenda = (id: string) => {
    const prendaBorrada = prendas.find((p) => p.id === id);
    const looksAntes = looks;
    setPrendas((prev) => prev.filter((p) => p.id !== id));
    // Quitarla de los looks que la incluyan
    setLooks((prev) => {
      const afectados = prev.filter((l) => l.prendaIds.includes(id));
      afectados.forEach((l) => {
        const nuevas = l.prendaIds.filter((pid) => pid !== id);
        if (nuevas.length === 0) {
          escribir("actualizar tus looks", supabase.from("looks").delete().eq("id", l.id));
        } else {
          escribir(
            "actualizar tus looks",
            supabase.from("looks").update({ prenda_ids: nuevas }).eq("id", l.id)
          );
        }
      });
      return prev
        .map((l) => ({ ...l, prendaIds: l.prendaIds.filter((pid) => pid !== id) }))
        .filter((l) => l.prendaIds.length > 0);
    });
    (async () => {
      const ok = await escribir(
        "borrar la prenda",
        supabase.from("prendas").delete().eq("id", id)
      );
      // Si no se borró de verdad, devolverla a la pantalla en vez de fingir
      if (!ok && prendaBorrada) {
        setPrendas((prev) => [prendaBorrada, ...prev]);
        setLooks(looksAntes);
      }
    })();
  };

  /* ── Looks ── */
  const addLook = (l: Look) => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("looks")
        .insert({ usuario_id: user.id, nombre: l.nombre, prenda_ids: l.prendaIds })
        .select()
        .single();
      if (error || !data) {
        console.error("[Dressé] fallo al guardar el look:", error?.message);
        fallo("guardar el look");
        return;
      }
      setLooks((prev) => [dbToLook(data), ...prev]);
    })();
  };

  const removeLook = (id: string) => {
    const borrado = looks.find((l) => l.id === id);
    setLooks((prev) => prev.filter((l) => l.id !== id));
    (async () => {
      const ok = await escribir(
        "borrar el look",
        supabase.from("looks").delete().eq("id", id)
      );
      if (!ok && borrado) setLooks((prev) => [borrado, ...prev]);
    })();
  };

  /* ── Historial del asesor ── */
  const addAnalisis = (a: AnalisisGuardado) => {
    if (!user) return;
    (async () => {
      const imagen_url = await subirImagen(a.imagen);
      const { data, error } = await supabase
        .from("historial_asesor")
        .insert({ usuario_id: user.id, compra: a.compra, resumen: a.resumen, imagen_url })
        .select()
        .single();
      // El historial es secundario: se registra el fallo pero no se molesta a
      // la usuaria, que ya tiene su respuesta del asesor en pantalla.
      if (error || !data) {
        console.error("[Dressé] fallo al guardar el historial:", error?.message);
        return;
      }
      const fotoAnalisis = await firmarUna(supabase, data.imagen_url);
      setHistorial((prev) =>
        [dbToAnalisis({ ...data, imagen_url: fotoAnalisis }), ...prev].slice(0, 5)
      );
    })();
  };

  /* ── Posts propios ── */
  const addPost = (p: PostPropio) => {
    if (!user) return;
    (async () => {
      const imagen_url = await subirImagen(p.imagen);
      const { data, error } = await supabase
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
      if (error || !data) {
        console.error("[Dressé] fallo al publicar:", error?.message);
        fallo("publicar tu outfit");
        return;
      }
      const fotoPost = await firmarUna(supabase, data.imagen_url);
      setMisPosts((prev) => [dbToPost({ ...data, imagen_url: fotoPost }), ...prev]);
    })();
  };

  const removePost = (id: string) => {
    const borrado = misPosts.find((p) => p.id === id);
    setMisPosts((prev) => prev.filter((p) => p.id !== id));
    (async () => {
      const ok = await escribir(
        "borrar la publicación",
        supabase.from("posts").delete().eq("id", id)
      );
      if (!ok && borrado) setMisPosts((prev) => [borrado, ...prev]);
    })();
  };

  /* ── Seguidores ── */
  const toggleSeguir = (usuarioId: string) => {
    if (!user || usuarioId === user.id) return;
    const seguiaAntes = seguidos.includes(usuarioId);
    // Deshacer si falla: creerte que sigues a alguien y no seguirle es de los
    // errores que peor sientan, porque no te enteras hasta mucho después.
    const deshacer = () =>
      setSeguidos((prev) =>
        seguiaAntes
          ? [...prev.filter((u) => u !== usuarioId), usuarioId]
          : prev.filter((u) => u !== usuarioId)
      );

    if (seguiaAntes) {
      setSeguidos((prev) => prev.filter((u) => u !== usuarioId));
      (async () => {
        const ok = await escribir(
          "dejar de seguir",
          supabase
            .from("seguidores")
            .delete()
            .eq("seguidor_id", user.id)
            .eq("seguido_id", usuarioId)
        );
        if (!ok) deshacer();
      })();
    } else {
      setSeguidos((prev) => [...prev, usuarioId]);
      (async () => {
        const ok = await escribir(
          "seguir a esta persona",
          supabase.from("seguidores").insert({ seguidor_id: user.id, seguido_id: usuarioId })
        );
        if (!ok) deshacer();
      })();
    }
  };

  /* ── Solicitudes de seguimiento (cuentas privadas) ── */
  const solicitarSeguir = (usuarioId: string) => {
    if (!user || usuarioId === user.id) return;
    setSolicitudesEnviadas((prev) => [...prev, usuarioId]);
    (async () => {
      const ok = await escribir(
        "enviar la solicitud",
        supabase.from("solicitudes").insert({ seguidor_id: user.id, seguido_id: usuarioId })
      );
      if (!ok) setSolicitudesEnviadas((prev) => prev.filter((u) => u !== usuarioId));
    })();
  };

  const cancelarSolicitud = (usuarioId: string) => {
    if (!user) return;
    setSolicitudesEnviadas((prev) => prev.filter((u) => u !== usuarioId));
    (async () => {
      const ok = await escribir(
        "cancelar la solicitud",
        supabase
          .from("solicitudes")
          .delete()
          .eq("seguidor_id", user.id)
          .eq("seguido_id", usuarioId)
      );
      if (!ok) setSolicitudesEnviadas((prev) => [...prev, usuarioId]);
    })();
  };

  const aceptarSolicitud = (usuarioId: string) => {
    if (!user) return;
    const solicitud = solicitudesRecibidas.find((s) => s.id === usuarioId);
    setSolicitudesRecibidas((prev) => prev.filter((s) => s.id !== usuarioId));
    setFollowersCount((n) => n + 1);
    (async () => {
      const ok = await escribir(
        "aceptar la solicitud",
        supabase.from("seguidores").insert({ seguidor_id: usuarioId, seguido_id: user.id })
      );
      if (!ok) {
        // Si no se pudo dar de alta el seguimiento, dejar la solicitud como
        // estaba en vez de hacerla desaparecer sin haber hecho nada.
        setFollowersCount((n) => Math.max(0, n - 1));
        if (solicitud) setSolicitudesRecibidas((prev) => [solicitud, ...prev]);
        return;
      }
      await escribir(
        "cerrar la solicitud",
        supabase
          .from("solicitudes")
          .delete()
          .eq("seguidor_id", usuarioId)
          .eq("seguido_id", user.id)
      );
    })();
  };

  const rechazarSolicitud = (usuarioId: string) => {
    if (!user) return;
    const solicitud = solicitudesRecibidas.find((s) => s.id === usuarioId);
    setSolicitudesRecibidas((prev) => prev.filter((s) => s.id !== usuarioId));
    (async () => {
      const ok = await escribir(
        "rechazar la solicitud",
        supabase
          .from("solicitudes")
          .delete()
          .eq("seguidor_id", usuarioId)
          .eq("seguido_id", user.id)
      );
      if (!ok && solicitud) setSolicitudesRecibidas((prev) => [solicitud, ...prev]);
    })();
  };

  /* ── Tableros (Pinterest) ── */
  const addTablero = async (nombre: string): Promise<string | null> => {
    if (!user || !nombre.trim()) return null;
    const { data, error } = await supabase
      .from("tableros")
      .insert({ usuario_id: user.id, nombre: nombre.trim() })
      .select()
      .single();
    if (error || !data) {
      console.error("[Dressé] fallo al crear el tablero:", error?.message);
      fallo("crear el tablero");
      return null;
    }
    setTableros((prev) => [...prev, { id: data.id, nombre: data.nombre, privado: false }]);
    return data.id;
  };

  const renameTablero = (id: string, nombre: string) => {
    const anterior = tableros.find((t) => t.id === id);
    setTableros((prev) => prev.map((t) => (t.id === id ? { ...t, nombre } : t)));
    (async () => {
      const ok = await escribir(
        "renombrar el tablero",
        supabase.from("tableros").update({ nombre }).eq("id", id)
      );
      if (!ok && anterior) {
        setTableros((prev) => prev.map((t) => (t.id === id ? anterior : t)));
      }
    })();
  };

  const removeTablero = (id: string) => {
    const borrado = tableros.find((t) => t.id === id);
    setTableros((prev) => prev.filter((t) => t.id !== id));
    (async () => {
      const ok = await escribir(
        "borrar el tablero",
        supabase.from("tableros").delete().eq("id", id)
      );
      if (!ok && borrado) setTableros((prev) => [...prev, borrado]);
    })();
  };

  const setTableroPrivado = (id: string, privado: boolean) => {
    setTableros((prev) => prev.map((t) => (t.id === id ? { ...t, privado } : t)));
    (async () => {
      const ok = await escribir(
        "cambiar la privacidad del tablero",
        supabase.from("tableros").update({ privado }).eq("id", id)
      );
      // Importante deshacerlo: si cree que un tablero es privado y no lo es,
      // está enseñando cosas sin saberlo.
      if (!ok) {
        setTableros((prev) => prev.map((t) => (t.id === id ? { ...t, privado: !privado } : t)));
      }
    })();
  };

  const guardarEnTablero = (tableroId: string, postId: string) => {
    escribir(
      "guardar en el tablero",
      supabase.from("tablero_posts").insert({ tablero_id: tableroId, post_id: postId })
    );
  };

  const quitarDeTablero = (tableroId: string, postId: string) => {
    escribir(
      "quitar del tablero",
      supabase
        .from("tablero_posts")
        .delete()
        .eq("tablero_id", tableroId)
        .eq("post_id", postId)
    );
  };

  /* ── Wishlist ── */
  const addWish = (w: WishItem) => {
    if (!user) return;
    (async () => {
      const imagen_url = await subirImagen(w.imagen);
      const { data, error } = await supabase
        .from("wishlist")
        .insert({ usuario_id: user.id, nota: w.nota, imagen_url })
        .select()
        .single();
      if (error || !data) {
        console.error("[Dressé] fallo al guardar en la wishlist:", error?.message);
        fallo("guardarlo en tu wishlist");
        return;
      }
      const fotoWish = await firmarUna(supabase, data.imagen_url);
      setWishlist((prev) => [dbToWish({ ...data, imagen_url: fotoWish }), ...prev]);
    })();
  };

  const removeWish = (id: string) => {
    const borrado = wishlist.find((w) => w.id === id);
    setWishlist((prev) => prev.filter((w) => w.id !== id));
    (async () => {
      const ok = await escribir(
        "quitarlo de tu wishlist",
        supabase.from("wishlist").delete().eq("id", id)
      );
      if (!ok && borrado) setWishlist((prev) => [borrado, ...prev]);
    })();
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
        avisoError,
        limpiarAviso,
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
