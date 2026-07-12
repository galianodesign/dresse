"use client";

import { useEffect, useState } from "react";
import BottomNav from "@/components/BottomNav";
import Header from "@/components/Header";
import { Flourish, SectionBackdrop } from "@/components/ThemeDecor";
import { createClient } from "@/lib/supabase/client";
import { useStore } from "@/lib/store";
import { useLockScroll } from "@/lib/useLockScroll";
import { getTheme } from "@/lib/themes";

interface PostFeed {
  id: string;
  usuarioId: string;
  username: string;
  fotoAutor: string | null;
  titulo: string;
  descripcion: string;
  imagen: string | null;
  estilo: string | null;
  fecha: string;
  likes: number;
  yoDiLike: boolean;
  comentarios: { username: string; texto: string }[];
  alto: number;
}

const ALTOS = [240, 300, 200, 280, 260, 320];
const ESTILOS_FILTRO = ["Todos", "Casual", "Elegante", "Streetwear", "Romántica", "Minimalista", "Colorida"];

export default function Comunidad() {
  const supabase = createClient();
  const { user, perfil, theme, seguidos, toggleSeguir, solicitudesEnviadas, solicitarSeguir, cancelarSolicitud, tableros, addTablero, guardarEnTablero, quitarDeTablero } = useStore();
  const t = getTheme(theme);

  const [posts, setPosts] = useState<PostFeed[]>([]);
  const [cargando, setCargando] = useState(true);
  const [abierto, setAbierto] = useState<PostFeed | null>(null);
  const [filtroEstilo, setFiltroEstilo] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [guardarAbierto, setGuardarAbierto] = useState(false);
  const [enTableros, setEnTableros] = useState<string[]>([]);
  const [nuevoTablero, setNuevoTablero] = useState("");

  async function abrirGuardar(postId: string) {
    setGuardarAbierto(true);
    setNuevoTablero("");
    const ids = tableros.map((t) => t.id);
    if (!ids.length) {
      setEnTableros([]);
      return;
    }
    const { data } = await supabase
      .from("tablero_posts")
      .select("tablero_id")
      .eq("post_id", postId)
      .in("tablero_id", ids);
    setEnTableros((data || []).map((r: any) => r.tablero_id));
  }
  const [perfilAbierto, setPerfilAbierto] = useState<{
    id: string;
    username: string;
    nombre: string;
    foto: string | null;
    privado: boolean;
    seguidores: number;
    siguiendo: number;
  } | null>(null);
  const [listaAbierta, setListaAbierta] = useState<{ titulo: string; gente: { id: string; username: string; foto: string | null }[] } | null>(null);

  useLockScroll(!!abierto || !!perfilAbierto || !!listaAbierta || guardarAbierto);

  async function abrirPerfil(id: string) {
    const [{ data: p }, fc, fg] = await Promise.all([
      supabase.from("perfiles").select("id, username, nombre, foto_url, privado").eq("id", id).single(),
      supabase.from("seguidores").select("seguidor_id", { count: "exact", head: true }).eq("seguido_id", id),
      supabase.from("seguidores").select("seguido_id", { count: "exact", head: true }).eq("seguidor_id", id),
    ]);
    setPerfilAbierto({
      id,
      username: p?.username || "dresse",
      nombre: p?.nombre || "",
      foto: p?.foto_url || null,
      privado: !!p?.privado,
      seguidores: fc.count || 0,
      siguiendo: fg.count || 0,
    });
  }

  async function abrirLista(titulo: string, usuarioId: string, tipo: "seguidores" | "seguidos") {
    const col = tipo === "seguidores" ? "seguido_id" : "seguidor_id";
    const otra = tipo === "seguidores" ? "seguidor_id" : "seguido_id";
    const { data: rows } = await supabase.from("seguidores").select(otra).eq(col, usuarioId);
    const ids = (rows || []).map((r: any) => r[otra]);
    if (!ids.length) {
      setListaAbierta({ titulo, gente: [] });
      return;
    }
    const { data: perfs } = await supabase.from("perfiles").select("id, username, foto_url").in("id", ids);
    setListaAbierta({
      titulo,
      gente: (perfs || []).map((p: any) => ({ id: p.id, username: p.username || "dresse", foto: p.foto_url })),
    });
  }

  useEffect(() => {
    if (!user) return;
    cargarFeed();
  }, [user]);

  async function cargarFeed() {
    setCargando(true);
    const { data: rows } = await supabase
      .from("posts")
      .select("*")
      .order("creado_en", { ascending: false })
      .limit(60);

    if (!rows || rows.length === 0) {
      setPosts([]);
      setCargando(false);
      return;
    }

    const postIds = rows.map((r: any) => r.id);
    const userIds = Array.from(new Set(rows.map((r: any) => r.usuario_id)));

    const [likesRes, comentariosRes, perfilesRes] = await Promise.all([
      supabase.from("post_likes").select("post_id, usuario_id").in("post_id", postIds),
      supabase.from("comentarios").select("post_id, usuario_id, texto, creado_en").in("post_id", postIds).order("creado_en"),
      supabase.from("perfiles").select("id, username, nombre, foto_url").in("id", userIds),
    ]);

    // Perfiles de comentaristas que no estén ya cargados
    const comentaristas = Array.from(
      new Set((comentariosRes.data || []).map((c: any) => c.usuario_id))
    ).filter((id) => !userIds.includes(id));
    let perfilesExtra: any[] = [];
    if (comentaristas.length) {
      const { data } = await supabase.from("perfiles").select("id, username, nombre, foto_url").in("id", comentaristas);
      perfilesExtra = data || [];
    }

    const nombrePor: Record<string, string> = {};
    const fotoPor: Record<string, string | null> = {};
    [...(perfilesRes.data || []), ...perfilesExtra].forEach((p: any) => {
      nombrePor[p.id] =
        p.username ||
        (p.nombre ? p.nombre.toLowerCase().replace(/\s+/g, ".") : "") ||
        "dresse";
      fotoPor[p.id] = p.foto_url || null;
    });

    const likesPor: Record<string, string[]> = {};
    (likesRes.data || []).forEach((l: any) => {
      likesPor[l.post_id] = likesPor[l.post_id] || [];
      likesPor[l.post_id].push(l.usuario_id);
    });

    const comentariosPor: Record<string, { username: string; texto: string }[]> = {};
    (comentariosRes.data || []).forEach((c: any) => {
      comentariosPor[c.post_id] = comentariosPor[c.post_id] || [];
      comentariosPor[c.post_id].push({
        username: nombrePor[c.usuario_id] || "dresse",
        texto: c.texto,
      });
    });

    setPosts(
      rows.map((r: any, i: number) => ({
        id: r.id,
        usuarioId: r.usuario_id,
        username: nombrePor[r.usuario_id] || "dresse",
        fotoAutor: fotoPor[r.usuario_id] || null,
        titulo: r.titulo,
        descripcion: r.descripcion || "",
        imagen: r.imagen_url,
        estilo: r.estilo,
        fecha: r.creado_en,
        likes: (likesPor[r.id] || []).length,
        yoDiLike: (likesPor[r.id] || []).includes(user!.id),
        comentarios: comentariosPor[r.id] || [],
        alto: ALTOS[i % ALTOS.length],
      }))
    );
    setCargando(false);
  }

  function actualizarPost(id: string, cambios: Partial<PostFeed>) {
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...cambios } : p)));
    setAbierto((prev) => (prev && prev.id === id ? { ...prev, ...cambios } : prev));
  }

  async function toggleLike(p: PostFeed) {
    if (!user) return;
    if (p.yoDiLike) {
      actualizarPost(p.id, { yoDiLike: false, likes: Math.max(0, p.likes - 1) });
      await supabase.from("post_likes").delete().eq("post_id", p.id).eq("usuario_id", user.id);
    } else {
      actualizarPost(p.id, { yoDiLike: true, likes: p.likes + 1 });
      await supabase.from("post_likes").insert({ post_id: p.id, usuario_id: user.id });
    }
  }

  async function enviarComentario(p: PostFeed) {
    const texto = nuevoComentario.trim();
    if (!texto || !user) return;
    setNuevoComentario("");
    const nuevo = { username: perfil.username || "tú", texto };
    actualizarPost(p.id, { comentarios: [...p.comentarios, nuevo] });
    await supabase.from("comentarios").insert({
      post_id: p.id,
      usuario_id: user.id,
      texto,
    });
  }

  const visibles = posts.filter((p) => {
    if (filtroEstilo !== "Todos" && p.estilo !== filtroEstilo) return false;
    const q = busqueda.trim().toLowerCase();
    if (!q) return true;
    return (
      p.titulo.toLowerCase().includes(q) ||
      p.username.toLowerCase().includes(q) ||
      p.descripcion.toLowerCase().includes(q)
    );
  });

  const destacado = posts.length
    ? [...posts].sort((a, b) => b.likes - a.likes)[0]
    : null;

  return (
    <main className="relative mx-auto max-w-md px-5 pb-28 pt-8">
      <SectionBackdrop seccion="comunidad" />

      <Header titulo="Comunidad" subtitulo="Los looks de todas, en tiempo real." />

      {cargando && (
        <p className="py-14 text-center text-sm text-muted">
          {t.motif} Cargando los looks…
        </p>
      )}

      {!cargando && posts.length === 0 && (
        <div className="py-14 text-center">
          <div className="mb-3 flex justify-center opacity-60">
            <Flourish size={64} />
          </div>
          <p className="text-sm text-muted">
            Aún no hay looks en la comunidad.
            <br />
            Sé la primera: publica el tuyo desde tu perfil.
          </p>
        </div>
      )}

      {!cargando && posts.length > 0 && (
        <>
          {/* Destacado */}
          {destacado && destacado.likes > 0 && (
            <button
              onClick={() => setAbierto(destacado)}
              className="card rise relative mb-5 flex w-full items-center gap-4 overflow-hidden p-4 text-left"
            >
              <div className="absolute -right-3 -top-3 opacity-50">
                <Flourish size={72} />
              </div>
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl"
                style={{ background: t.tile }}
              >
                {destacado.imagen ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={destacado.imagen} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl">{t.motif}</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[12px] uppercase tracking-[0.25em] text-accent">
                  {t.motif} Destacado
                </p>
                <p className="truncate font-display text-lg leading-snug">{destacado.titulo}</p>
                <p className="text-xs text-muted">
                  @{destacado.username} · ♥ {destacado.likes}
                </p>
              </div>
            </button>
          )}

          {/* Buscador */}
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar looks o usuarias…"
            className="mb-4 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-accent"
          />

          {/* Filtros por estilo */}
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            {ESTILOS_FILTRO.map((e) => (
              <button key={e} onClick={() => setFiltroEstilo(e)} className="chip" data-active={filtroEstilo === e}>
                {e}
              </button>
            ))}
          </div>

          {/* Grid tipo Pinterest */}
          <div className="masonry rise">
            {visibles.map((p) => (
              <button key={p.id} onClick={() => setAbierto(p)} className="card block w-full overflow-hidden text-left">
                <div
                  className="flex w-full items-center justify-center overflow-hidden"
                  style={{ height: p.alto, background: t.tile }}
                >
                  {p.imagen ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imagen} alt={p.titulo} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-4xl">{t.motif}</span>
                  )}
                </div>
                <div className="px-3 py-2.5">
                  <p className="truncate font-display text-base leading-tight">{p.titulo}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="flex min-w-0 items-center gap-1.5 text-[12px] text-muted">
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accentSoft text-[8px]">
                        {p.fotoAutor ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.fotoAutor} alt="" className="h-full w-full object-cover" />
                        ) : (
                          p.username[0]?.toUpperCase()
                        )}
                      </span>
                      <span className="truncate">@{p.username}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1 text-[12px] text-muted">
                      <svg viewBox="0 0 24 24" className="h-3 w-3" fill={p.yoDiLike ? "var(--accent)" : "none"} stroke="var(--accent)" strokeWidth="1.8">
                        <path d="M12 21s-7.5-4.7-10-9.3C.5 8 2.5 4.5 6 4.5c2.2 0 3.7 1.2 6 3.6 2.3-2.4 3.8-3.6 6-3.6 3.5 0 5.5 3.5 4 7.2C19.5 16.3 12 21 12 21z" strokeLinejoin="round" />
                      </svg>
                      {p.likes}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {visibles.length === 0 && (
            <div className="py-14 text-center">
              <div className="mb-3 flex justify-center opacity-60">
                <Flourish size={64} />
              </div>
              <p className="text-sm text-muted">No hay looks que encajen con tu búsqueda.</p>
            </div>
          )}
        </>
      )}

      {/* Post en detalle */}
      {abierto && (
        <div className="overlay fixed inset-0 z-50 overflow-y-auto bg-ink/50 backdrop-blur-sm" onClick={() => setAbierto(null)}>
          <div className="sheet mx-auto mt-10 max-w-md rounded-t-3xl bg-bg pb-28" onClick={(e) => e.stopPropagation()}>
            {/* Cabecera de autoría estilo Instagram */}
            <button
              onClick={() => abrirPerfil(abierto.usuarioId)}
              className="flex w-full items-center gap-3 rounded-t-3xl px-5 py-3.5 text-left"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full font-display text-base" style={{ background: t.tile }}>
                {abierto.fotoAutor ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={abierto.fotoAutor} alt="" className="h-full w-full object-cover" />
                ) : (
                  abierto.username[0]?.toUpperCase()
                )}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">@{abierto.username}</span>
                <span className="block text-[12px] text-muted">
                  {new Date(abierto.fecha).toLocaleDateString("es-ES", { day: "numeric", month: "long" })}
                  {abierto.estilo && ` · ${abierto.estilo}`}
                </span>
              </span>
            </button>
            <div
              className="relative flex h-80 items-center justify-center overflow-hidden"
              style={{ background: t.tile }}
            >
              {abierto.imagen ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={abierto.imagen} alt={abierto.titulo} className="h-full w-full object-cover" />
              ) : (
                <span className="text-7xl">{t.motif}</span>
              )}
              <button
                onClick={() => setAbierto(null)}
                className="btn-cerrar absolute right-4 top-4"
                aria-label="Cerrar"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="px-5 pt-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-display text-2xl leading-snug">{abierto.titulo}</h2>
                </div>
                <button onClick={() => abrirGuardar(abierto.id)} className="flex flex-col items-center gap-0.5 pt-1" aria-label="Guardar">
                  <svg viewBox="0 0 24 24" className="h-7 w-7" fill={enTableros.length && guardarAbierto ? "var(--accent)" : "none"} stroke="var(--accent)" strokeWidth="1.8">
                    <path d="M6 3h12v18l-6-4-6 4V3z" strokeLinejoin="round" />
                  </svg>
                  <span className="text-[12px] text-muted">Guardar</span>
                </button>
                <button onClick={() => toggleLike(abierto)} className="flex flex-col items-center gap-0.5 pt-1" aria-label="Me gusta">
                  <svg viewBox="0 0 24 24" className={`h-7 w-7 ${abierto.yoDiLike ? "heart-pop" : ""}`} fill={abierto.yoDiLike ? "var(--accent)" : "none"} stroke="var(--accent)" strokeWidth="1.8">
                    <path d="M12 21s-7.5-4.7-10-9.3C.5 8 2.5 4.5 6 4.5c2.2 0 3.7 1.2 6 3.6 2.3-2.4 3.8-3.6 6-3.6 3.5 0 5.5 3.5 4 7.2C19.5 16.3 12 21 12 21z" strokeLinejoin="round" />
                  </svg>
                  <span className="text-[12px] text-muted">{abierto.likes}</span>
                </button>
              </div>

              {abierto.descripcion && (
                <p className="mt-2 text-sm leading-relaxed text-muted">{abierto.descripcion}</p>
              )}

              {/* Compartir */}
              <button
                onClick={() => {
                  const texto = `${abierto.titulo} — outfit de @${abierto.username} en Dressé`;
                  if (navigator.share) {
                    navigator.share({ title: "Dressé", text: texto, url: location.origin }).catch(() => {});
                  } else {
                    navigator.clipboard?.writeText(`${texto} ${location.origin}`);
                    alert("Copiado al portapapeles");
                  }
                }}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-[14px] border border-line bg-surface py-3 text-sm"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 3v13M8 7l4-4 4 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Compartir este look
              </button>

              {/* Comentarios */}
              <h3 className="mt-5 text-xs uppercase tracking-[0.25em] text-muted">Comentarios</h3>
              <div className="mt-2 space-y-3">
                {abierto.comentarios.length === 0 && (
                  <p className="text-sm text-muted">Nadie ha comentado aún. Sé la primera.</p>
                )}
                {abierto.comentarios.map((c, i) => (
                  <div key={i} className="text-sm leading-relaxed">
                    <span className="font-medium">@{c.username}</span>{" "}
                    <span className="text-muted">{c.texto}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex gap-2">
                <input
                  value={nuevoComentario}
                  onChange={(e) => setNuevoComentario(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && enviarComentario(abierto)}
                  placeholder="Añade un comentario…"
                  className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-accent"
                />
                <button onClick={() => enviarComentario(abierto)} className="rounded-xl bg-ink px-4 text-sm text-bg">
                  Enviar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Perfil público */}
      {perfilAbierto && (
        <div className="overlay fixed inset-0 z-[60] overflow-y-auto bg-ink/50 backdrop-blur-sm" onClick={() => setPerfilAbierto(null)}>
          <div className="sheet mx-auto mt-16 max-w-md rounded-t-3xl bg-bg px-5 pb-28 pt-6" onClick={(e) => e.stopPropagation()}>
            {(() => {
              const p = perfilAbierto;
              const esYo = user?.id === p.id;
              const loSigo = seguidos.includes(p.id);
              const solicitado = solicitudesEnviadas.includes(p.id);
              const puedeVerListas = esYo || !p.privado || loSigo;
              const suyos = posts.filter((x) => x.usuarioId === p.id);

              return (
                <>
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full font-display text-2xl" style={{ background: t.tile }}>
                      {p.foto ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.foto} alt="" className="h-full w-full object-cover" />
                      ) : (
                        p.username[0]?.toUpperCase() || "D"
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-2xl">@{p.username}</p>
                      <div className="mt-0.5 flex gap-4 text-xs text-muted">
                        <button
                          disabled={!puedeVerListas}
                          onClick={() => abrirLista("Seguidores", p.id, "seguidores")}
                          className={puedeVerListas ? "underline underline-offset-2" : "opacity-70"}
                        >
                          {p.seguidores} seguidores
                        </button>
                        <button
                          disabled={!puedeVerListas}
                          onClick={() => abrirLista("Seguidos", p.id, "seguidos")}
                          className={puedeVerListas ? "underline underline-offset-2" : "opacity-70"}
                        >
                          {p.siguiendo} seguidos
                        </button>
                      </div>
                      {p.privado && (
                        <p className="mt-1 flex items-center gap-1 text-[12px] text-muted">
                          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="5" y="11" width="14" height="9" rx="2" />
                            <path d="M8 11V8a4 4 0 018 0v3" />
                          </svg>
                          Cuenta privada
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setPerfilAbierto(null)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line"
                      aria-label="Cerrar"
                    >
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>

                  {!esYo && (
                    <button
                      onClick={() => {
                        if (loSigo) {
                          toggleSeguir(p.id);
                          setPerfilAbierto({ ...p, seguidores: Math.max(0, p.seguidores - 1) });
                        } else if (solicitado) {
                          cancelarSolicitud(p.id);
                        } else if (p.privado) {
                          solicitarSeguir(p.id);
                        } else {
                          toggleSeguir(p.id);
                          setPerfilAbierto({ ...p, seguidores: p.seguidores + 1 });
                        }
                      }}
                      className={`mt-4 w-full rounded-xl py-3 text-sm ${
                        loSigo || solicitado
                          ? "border border-line bg-surface text-muted"
                          : "bg-ink text-bg"
                      }`}
                    >
                      {loSigo
                        ? "Siguiendo"
                        : solicitado
                        ? "Solicitado · toca para cancelar"
                        : p.privado
                        ? "Solicitar seguir"
                        : "Seguir"}
                    </button>
                  )}

                  <h3 className="mt-6 text-xs uppercase tracking-[0.25em] text-muted">Sus looks</h3>
                  {p.privado && !loSigo && !esYo ? (
                    <div className="py-10 text-center">
                      <div className="mb-3 flex justify-center opacity-60">
                        <Flourish size={56} />
                      </div>
                      <p className="text-sm text-muted">
                        Esta cuenta es privada.
                        <br />
                        Solicita seguirla para ver sus looks.
                      </p>
                    </div>
                  ) : (
                    <div className="masonry mt-3">
                      {suyos.map((x) => (
                        <button
                          key={x.id}
                          onClick={() => {
                            setPerfilAbierto(null);
                            setAbierto(x);
                          }}
                          className="card block w-full overflow-hidden text-left"
                        >
                          <div className="flex w-full items-center justify-center overflow-hidden" style={{ height: x.alto * 0.7, background: t.tile }}>
                            {x.imagen ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={x.imagen} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-3xl">{t.motif}</span>
                            )}
                          </div>
                          <div className="px-3 py-2">
                            <p className="truncate font-display text-sm">{x.titulo}</p>
                            <p className="text-[12px] text-muted">♥ {x.likes}</p>
                          </div>
                        </button>
                      ))}
                      {suyos.length === 0 && (
                        <p className="py-8 text-sm text-muted">Aún no ha publicado looks.</p>
                      )}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Lista de seguidores / seguidos */}
      {listaAbierta && (
        <div className="overlay fixed inset-0 z-[70] flex items-end bg-ink/40" onClick={() => setListaAbierta(null)}>
          <div className="sheet max-h-[70vh] w-full overflow-y-auto rounded-t-3xl bg-surface p-6 pb-10" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-2xl">{listaAbierta.titulo}</h2>
            <div className="mt-4 space-y-2">
              {listaAbierta.gente.length === 0 && (
                <p className="text-sm text-muted">Nadie por aquí todavía.</p>
              )}
              {listaAbierta.gente.map((g) => (
                <button
                  key={g.id}
                  onClick={() => {
                    setListaAbierta(null);
                    abrirPerfil(g.id);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl border border-line bg-bg p-3 text-left"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full font-display" style={{ background: t.tile }}>
                    {g.foto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={g.foto} alt="" className="h-full w-full object-cover" />
                    ) : (
                      g.username[0]?.toUpperCase()
                    )}
                  </span>
                  <span className="truncate text-sm">@{g.username}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Guardar en tablero (estilo Pinterest) */}
      {guardarAbierto && abierto && (
        <div className="overlay fixed inset-0 z-[75] flex items-end bg-ink/40" onClick={() => setGuardarAbierto(false)}>
          <div className="sheet max-h-[70vh] w-full overflow-y-auto rounded-t-3xl bg-surface p-6 pb-10" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-2xl">Guardar en…</h2>
            <div className="mt-4 space-y-2">
              {tableros.map((tb) => {
                const dentro = enTableros.includes(tb.id);
                return (
                  <button
                    key={tb.id}
                    onClick={() => {
                      if (dentro) {
                        quitarDeTablero(tb.id, abierto.id);
                        setEnTableros((prev) => prev.filter((x) => x !== tb.id));
                      } else {
                        guardarEnTablero(tb.id, abierto.id);
                        setEnTableros((prev) => [...prev, tb.id]);
                      }
                    }}
                    className={`flex w-full items-center justify-between rounded-xl border px-4 py-3.5 text-left text-sm ${
                      dentro ? "border-accent bg-accentSoft" : "border-line bg-bg"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {tb.nombre}
                      {tb.privado && (
                        <svg viewBox="0 0 24 24" className="h-3 w-3 text-muted" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="5" y="11" width="14" height="9" rx="2" />
                          <path d="M8 11V8a4 4 0 018 0v3" />
                        </svg>
                      )}
                    </span>
                    {dentro && (
                      <svg viewBox="0 0 24 24" className="h-4 w-4 text-accent" fill="none" stroke="currentColor" strokeWidth="2.4">
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                );
              })}
              {tableros.length === 0 && (
                <p className="text-sm text-muted">Aún no tienes tableros. Crea el primero:</p>
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <input
                value={nuevoTablero}
                onChange={(e) => setNuevoTablero(e.target.value)}
                placeholder="Nuevo tablero (ej. Looks de verano)"
                className="min-w-0 flex-1 rounded-xl border border-line bg-bg px-4 py-3 text-sm outline-none focus:border-accent"
              />
              <button
                onClick={async () => {
                  const id = await addTablero(nuevoTablero);
                  if (id && abierto) {
                    guardarEnTablero(id, abierto.id);
                    setEnTableros((prev) => [...prev, id]);
                    setNuevoTablero("");
                  }
                }}
                disabled={!nuevoTablero.trim()}
                className="rounded-xl bg-ink px-4 text-sm text-bg disabled:opacity-40"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  );
}
