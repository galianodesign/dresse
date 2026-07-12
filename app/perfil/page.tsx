"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { createClient } from "@/lib/supabase/client";
import PerfilPublico from "@/components/PerfilPublico";
import { useLockScroll } from "@/lib/useLockScroll";
import BottomNav from "@/components/BottomNav";
import ThemePicker from "@/components/ThemePicker";
import { Flourish, SectionBackdrop } from "@/components/ThemeDecor";
import PrendaCard from "@/components/PrendaCard";
import { useStore } from "@/lib/store";
import { CATEGORIAS, PostPropio } from "@/lib/data";
import { THEMES, getTheme } from "@/lib/themes";
import Toast from "@/components/Toast";

type Pestana = "posts" | "guardados" | "looks" | "favoritas" | "stats";
type Panel =
  | null
  | "ajustes"
  | "editar"
  | "tema"
  | "plan"
  | "publicar";

export default function Perfil() {
  const {
    perfil,
    setPerfil,
    prendas,
    looks,
    removeLook,
    misPosts,
    addPost,
    removePost,
    seguidos,
    followersCount,
    solicitudesRecibidas,
    aceptarSolicitud,
    rechazarSolicitud,
    tableros,
    addTablero,
    renameTablero,
    removeTablero,
    setTableroPrivado,
    quitarDeTablero,
    user,
    theme,
  } = useStore();
  const t = getTheme(theme);

  const [pestana, setPestana] = useState<Pestana>("posts");
  const [perfilVisitado, setPerfilVisitado] = useState<string | null>(null);
  const [tableroAbierto, setTableroAbierto] = useState<{ id: string; nombre: string; privado: boolean } | null>(null);
  const [postsTablero, setPostsTablero] = useState<{ id: string; titulo: string; imagen: string | null }[]>([]);
  const [portadas, setPortadas] = useState<Record<string, string | null>>({});
  const [conteos, setConteos] = useState<Record<string, number>>({});

  async function cargarPortadas() {
    if (!user || tableros.length === 0) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("tablero_posts")
      .select("tablero_id, post_id")
      .in("tablero_id", tableros.map((t) => t.id));
    if (!data) return;
    const cts: Record<string, number> = {};
    const primero: Record<string, string> = {};
    data.forEach((r: any) => {
      cts[r.tablero_id] = (cts[r.tablero_id] || 0) + 1;
      if (!primero[r.tablero_id]) primero[r.tablero_id] = r.post_id;
    });
    setConteos(cts);
    const postIds = Object.values(primero);
    if (postIds.length) {
      const { data: ps } = await supabase.from("posts").select("id, imagen_url").in("id", postIds);
      const imgPor: Record<string, string | null> = {};
      (ps || []).forEach((p: any) => (imgPor[p.id] = p.imagen_url));
      const port: Record<string, string | null> = {};
      Object.entries(primero).forEach(([tid, pid]) => (port[tid] = imgPor[pid] || null));
      setPortadas(port);
    }
  }

  async function abrirTablero(tb: { id: string; nombre: string; privado: boolean }) {
    setTableroAbierto(tb);
    setPostsTablero([]);
    const supabase = createClient();
    const { data } = await supabase.from("tablero_posts").select("post_id").eq("tablero_id", tb.id);
    const ids = (data || []).map((r: any) => r.post_id);
    if (!ids.length) return;
    const { data: ps } = await supabase.from("posts").select("id, titulo, imagen_url").in("id", ids);
    setPostsTablero((ps || []).map((p: any) => ({ id: p.id, titulo: p.titulo, imagen: p.imagen_url })));
  }
  const [panel, setPanel] = useState<Panel>(null);
  const [postAbierto, setPostAbierto] = useState<PostPropio | null>(null);
  const [listaAbierta, setListaAbierta] = useState<{ titulo: string; gente: { id?: string; username: string; foto: string | null }[] } | null>(null);

  useLockScroll(!!postAbierto || !!panel || !!listaAbierta || !!perfilVisitado || !!tableroAbierto);

  async function abrirLista(titulo: string, tipo: "seguidores" | "seguidos") {
    if (!user) return;
    const supabase = createClient();
    const col = tipo === "seguidores" ? "seguido_id" : "seguidor_id";
    const otra = tipo === "seguidores" ? "seguidor_id" : "seguido_id";
    const { data: rows } = await supabase.from("seguidores").select(otra).eq(col, user.id);
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
  const [likesPropios, setLikesPropios] = useState<Record<string, boolean>>({});
  const { logout } = useAuth();
  const [toast, setToast] = useState("");
  const [racha, setRacha] = useState(1);

  useEffect(() => {
    try {
      const hoy = new Date().toDateString();
      const datos = JSON.parse(localStorage.getItem("dresse.racha") || "{}");
      if (datos.ultimo !== hoy) {
        const ayer = new Date(Date.now() - 86400000).toDateString();
        const nueva = datos.ultimo === ayer ? (datos.dias || 0) + 1 : 1;
        localStorage.setItem("dresse.racha", JSON.stringify({ ultimo: hoy, dias: nueva }));
        setRacha(nueva);
      } else {
        setRacha(datos.dias || 1);
      }
    } catch {}
  }, []);

  function avisar(msg: string) {
    setToast("");
    requestAnimationFrame(() => setToast(msg));
    setTimeout(() => setToast(""), 1900);
  }

  // Edición de perfil
  const [edNombre, setEdNombre] = useState("");
  const [edUsername, setEdUsername] = useState("");
  const [edBio, setEdBio] = useState("");
  const [edEstilo, setEdEstilo] = useState("");
  const fotoPerfilRef = useRef<HTMLInputElement>(null);

  // Publicar outfit
  const [pubFoto, setPubFoto] = useState<string | null>(null);
  const [pubTitulo, setPubTitulo] = useState("");
  const [pubDesc, setPubDesc] = useState("");
  const [pubPrendas, setPubPrendas] = useState<string[]>([]);
  const pubCamRef = useRef<HTMLInputElement>(null);
  const pubGalRef = useRef<HTMLInputElement>(null);

  const favoritas = prendas.filter((p) => p.favorito);
  const total = prendas.length || 1;
  const username =
    perfil.username ||
    (perfil.nombre ? perfil.nombre.toLowerCase().replace(/\s+/g, ".") : "tu.usuario");

  function abrirEditar() {
    setEdNombre(perfil.nombre);
    setEdUsername(perfil.username || username);
    setEdBio(perfil.bio);
    setEdEstilo(perfil.estilo);
    setPanel("editar");
  }

  function leerFotoPerfil(f: File) {
    const r = new FileReader();
    r.onload = () => setPerfil({ foto: r.result as string });
    r.readAsDataURL(f);
  }

  function leerFotoPost(f: File) {
    const r = new FileReader();
    r.onload = () => setPubFoto(r.result as string);
    r.readAsDataURL(f);
  }

  function publicar() {
    if (!pubFoto || !pubTitulo.trim()) return;
    addPost({
      id: `post${Date.now()}`,
      imagen: pubFoto,
      titulo: pubTitulo.trim(),
      descripcion: pubDesc.trim(),
      prendaIds: pubPrendas,
      likes: 0,
      fecha: new Date().toISOString(),
    });
    setPubFoto(null);
    setPubTitulo("");
    setPubDesc("");
    setPubPrendas([]);
    setPanel(null);
    avisar("Outfit publicado");
  }

  const nombreDe = (id: string) => prendas.find((p) => p.id === id)?.nombre || "—";

  return (
    <main className="relative mx-auto max-w-md px-5 pb-28 pt-8">
      <SectionBackdrop seccion="perfil" />

      {/* ── Cabecera de perfil social ── */}
      <div className="rise">
        <div className="flex items-start justify-between">
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-muted">
            <span className="text-accent">{t.motif}</span> Dressé
          </p>
          {/* Desplegable de ajustes */}
          <button
            onClick={() => setPanel("ajustes")}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface"
            aria-label="Ajustes"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.7 1.7 0 00.34 1.87l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.7 1.7 0 00-1.87-.34 1.7 1.7 0 00-1 1.55V21a2 2 0 11-4 0v-.09a1.7 1.7 0 00-1-1.55 1.7 1.7 0 00-1.87.34l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.7 1.7 0 00.34-1.87 1.7 1.7 0 00-1.55-1H3a2 2 0 110-4h.09a1.7 1.7 0 001.55-1 1.7 1.7 0 00-.34-1.87l-.06-.06A2 2 0 117.07 4.2l.06.06a1.7 1.7 0 001.87.34h.01a1.7 1.7 0 001-1.55V3a2 2 0 114 0v.09a1.7 1.7 0 001 1.55h.01a1.7 1.7 0 001.87-.34l.06-.06a2 2 0 112.83 2.83l-.06.06a1.7 1.7 0 00-.34 1.87v.01a1.7 1.7 0 001.55 1H21a2 2 0 110 4h-.09a1.7 1.7 0 00-1.55 1z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="mt-4 flex items-center gap-5">
          {/* Avatar */}
          <button
            onClick={() => fotoPerfilRef.current?.click()}
            className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-accent"
            aria-label="Cambiar foto de perfil"
          >
            {perfil.foto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={perfil.foto} alt="Tu foto" className="h-full w-full object-cover" />
            ) : (
              <span
                className="flex h-full w-full items-center justify-center font-display text-3xl"
                style={{ background: t.tile }}
              >
                {(perfil.nombre || "D")[0].toUpperCase()}
              </span>
            )}
          </button>
          <input
            ref={fotoPerfilRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) leerFotoPerfil(f);
              e.target.value = "";
            }}
          />

          {/* Contadores */}
          <div className="flex flex-1 justify-around text-center">
            <div>
              <p className="font-display text-xl">{misPosts.length}</p>
              <p className="text-[12px] text-muted">posts</p>
            </div>
            <button onClick={() => abrirLista("Seguidores", "seguidores")}>
              <p className="font-display text-xl">{followersCount}</p>
              <p className="text-[12px] text-muted">seguidores</p>
            </button>
            <button onClick={() => abrirLista("Seguidos", "seguidos")}>
              <p className="font-display text-xl">{seguidos.length}</p>
              <p className="text-[12px] text-muted">seguidos</p>
            </button>
          </div>
        </div>

        <div className="mt-3">
          <p className="font-display text-xl leading-tight">
            {perfil.nombre || "Tu nombre"}
          </p>
          <p className="text-xs text-accent">@{username}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            {perfil.bio || `${t.motif} Añade una bio desde “Editar perfil”.`}
          </p>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            onClick={abrirEditar}
            className="flex-1 rounded-xl border border-line bg-surface py-2.5 text-xs"
          >
            Editar perfil
          </button>
          <button
            onClick={() => setPanel("publicar")}
            className="flex-1 rounded-xl bg-ink py-2.5 text-xs text-bg"
          >
            + Publicar outfit
          </button>
        </div>
      </div>

      {/* ── Solicitudes de seguimiento ── */}
      {solicitudesRecibidas.length > 0 && (
        <section className="card rise mt-5 p-4">
          <h2 className="text-xs uppercase tracking-[0.25em] text-muted">
            Solicitudes de seguimiento ({solicitudesRecibidas.length})
          </h2>
          <div className="mt-3 space-y-3">
            {solicitudesRecibidas.map((s) => (
              <div key={s.id} className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full font-display" style={{ background: t.tile }}>
                  {s.foto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.foto} alt="" className="h-full w-full object-cover" />
                  ) : (
                    s.username[0]?.toUpperCase()
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">@{s.username}</p>
                  <p className="truncate text-[12px] text-muted">{s.nombre}</p>
                </div>
                <button
                  onClick={() => {
                    aceptarSolicitud(s.id);
                    avisar("Solicitud aceptada");
                  }}
                  className="shrink-0 rounded-xl bg-ink px-4 py-2 text-xs text-bg"
                >
                  Confirmar
                </button>
                <button
                  onClick={() => rechazarSolicitud(s.id)}
                  className="shrink-0 rounded-xl border border-line bg-surface px-4 py-2 text-xs text-muted"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Pestañas ── */}
      <div className="mt-6 flex gap-2 overflow-x-auto border-b border-line pb-2">
        {(
          [
            ["posts", "Posts"],
            ["guardados", `Guardados${tableros.length ? ` (${tableros.length})` : ""}`],
            ["looks", `Looks${looks.length ? ` (${looks.length})` : ""}`],
            ["favoritas", `Favoritas${favoritas.length ? ` (${favoritas.length})` : ""}`],
            ["stats", "Estadísticas"],
          ] as [Pestana, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            className="chip"
            data-active={pestana === id}
            onClick={() => {
              setPestana(id);
              if (id === "guardados") cargarPortadas();
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Contenido de pestañas ── */}
      <div className="mt-4">
        {pestana === "posts" && (
          <>
            {misPosts.length === 0 ? (
              <div className="py-14 text-center">
                <div className="mb-3 flex justify-center opacity-60">
                  <Flourish size={64} />
                </div>
                <p className="text-sm text-muted">
                  Aún no has publicado ningún outfit.
                  <br />
                  Pulsa “+ Publicar outfit” y estrena tu perfil.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1.5">
                {misPosts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPostAbierto(p)}
                    className="relative aspect-square overflow-hidden rounded-lg border border-line bg-accentSoft"
                  >
                    {p.imagen && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imagen} alt={p.titulo} className="h-full w-full object-cover" />
                    )}
                    <span className="absolute bottom-1 right-1.5 rounded-full bg-ink/60 px-1.5 py-0.5 text-[12px] text-bg">
                      ♥ {p.likes + (likesPropios[p.id] ? 1 : 0)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {pestana === "guardados" && (
          <>
            {tableros.length === 0 ? (
              <div className="py-14 text-center">
                <div className="mb-3 flex justify-center opacity-60">
                  <Flourish size={64} />
                </div>
                <p className="text-sm text-muted">
                  Tus tableros aparecerán aquí.
                  <br />
                  Guarda looks de la comunidad para crear el primero.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {tableros.map((tb) => (
                  <button key={tb.id} onClick={() => abrirTablero(tb)} className="card overflow-hidden text-left">
                    <div className="flex h-28 items-center justify-center overflow-hidden" style={{ background: t.tile }}>
                      {portadas[tb.id] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={portadas[tb.id]!} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-3xl">{t.motif}</span>
                      )}
                    </div>
                    <div className="px-3 py-2.5">
                      <p className="flex items-center gap-1.5 truncate font-display text-base leading-tight">
                        {tb.nombre}
                        {tb.privado && (
                          <svg viewBox="0 0 24 24" className="h-3 w-3 shrink-0 text-muted" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="5" y="11" width="14" height="9" rx="2" />
                            <path d="M8 11V8a4 4 0 018 0v3" />
                          </svg>
                        )}
                      </p>
                      <p className="text-[12px] text-muted">{conteos[tb.id] || 0} looks</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {pestana === "looks" && (
          <div className="space-y-3">
            {looks.length === 0 && (
              <p className="py-14 text-center text-sm text-muted">
                Tus looks guardados del armario aparecerán aquí.
              </p>
            )}
            {looks.map((l) => (
              <div key={l.id} className="hang-tag px-4 py-4 pt-7">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-display text-lg">{l.nombre}</p>
                  <button
                    onClick={() => removeLook(l.id)}
                    className="text-[12px] text-muted underline underline-offset-2"
                  >
                    Eliminar
                  </button>
                </div>
                <p className="mt-1 text-sm text-muted">
                  {l.prendaIds.map(nombreDe).join(" + ")}
                </p>
              </div>
            ))}
          </div>
        )}

        {pestana === "favoritas" && (
          <>
            {favoritas.length === 0 ? (
              <p className="py-14 text-center text-sm text-muted">
                Marca prendas como favoritas desde su detalle en el armario
                (el corazón) y aparecerán aquí.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {favoritas.map((p) => (
                  <PrendaCard key={p.id} prenda={p} />
                ))}
              </div>
            )}
          </>
        )}

        {pestana === "stats" && (
          <div className="card p-5">
            <h2 className="text-xs uppercase tracking-[0.25em] text-muted">
              Tu armario en números
            </h2>
            <div className="mt-4 space-y-3">
              {CATEGORIAS.map((c) => {
                const n = prendas.filter((p) => p.categoria === c.id).length;
                return (
                  <div key={c.id}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span>{c.label}</span>
                      <span className="text-muted">{n}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-accentSoft">
                      <div className="stat-bar" style={{ width: `${Math.max(4, (n / total) * 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 border-t border-line pt-3 text-xs text-muted">
              {prendas.length} prendas · {looks.length} looks · {favoritas.length} favoritas ·{" "}
              {misPosts.length} posts publicados
            </p>

            {(() => {
              const estrella = [...prendas].sort((a, b) => (b.usos || 0) - (a.usos || 0))[0];
              const mesActual = new Date().getMonth();
              const usadasEsteMes = prendas.filter(
                (p) => p.ultimoUso && new Date(p.ultimoUso).getMonth() === mesActual
              ).length;
              return (
                <>
                  {estrella && (estrella.usos || 0) > 0 && (
                    <div className="mt-4 rounded-xl bg-accentSoft p-3">
                      <p className="text-[12px] uppercase tracking-[0.25em] text-accent">
                        ★ Prenda estrella
                      </p>
                      <p className="mt-0.5 text-sm">
                        {estrella.nombre} — te la has puesto {estrella.usos} {estrella.usos === 1 ? "vez" : "veces"}
                      </p>
                    </div>
                  )}

                  <div className="mt-3 rounded-xl border border-line p-3">
                    <p className="text-[12px] uppercase tracking-[0.25em] text-muted">
                      Resumen del mes
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-muted">
                      🔥 Racha de <span className="text-ink">{racha} {racha === 1 ? "día" : "días"}</span> ·{" "}
                      {usadasEsteMes} prendas usadas este mes · {looks.length} looks creados
                    </p>
                  </div>

                  <div className="mt-3">
                    <p className="text-[12px] uppercase tracking-[0.25em] text-muted">
                      Logros
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {[
                        [prendas.length >= 10, "🧺 10 prendas"],
                        [prendas.length >= 25, "👗 25 prendas"],
                        [looks.length >= 1, "✨ Primer look"],
                        [looks.length >= 5, "🎨 5 looks"],
                        [misPosts.length >= 1, "📸 Primer post"],
                        [favoritas.length >= 3, "♥ 3 favoritas"],
                        [racha >= 3, "🔥 Racha de 3 días"],
                        [racha >= 7, "🏆 Racha semanal"],
                      ].map(([ok, label]) => (
                        <span
                          key={label as string}
                          className="chip"
                          data-active={ok as boolean}
                          style={{ opacity: ok ? 1 : 0.45 }}
                        >
                          {label as string}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* ── Detalle de post propio ── */}
      {postAbierto && (
        <div
          className="overlay fixed inset-0 z-50 overflow-y-auto bg-ink/50 backdrop-blur-sm"
          onClick={() => setPostAbierto(null)}
        >
          <div
            className="sheet mx-auto mt-12 max-w-md rounded-t-3xl bg-bg pb-28"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              {postAbierto.imagen && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={postAbierto.imagen} alt={postAbierto.titulo} className="max-h-96 w-full rounded-t-3xl object-cover" />
              )}
              <button
                onClick={() => setPostAbierto(null)}
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
                <div>
                  <p className="text-xs text-accent">@{username}</p>
                  <h2 className="mt-0.5 font-display text-2xl leading-snug">
                    {postAbierto.titulo}
                  </h2>
                  <p className="mt-0.5 text-[12px] text-muted">
                    {new Date(postAbierto.fecha).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
                <button
                  onClick={() =>
                    setLikesPropios((prev) => ({ ...prev, [postAbierto.id]: !prev[postAbierto.id] }))
                  }
                  className="flex flex-col items-center gap-0.5 pt-1"
                  aria-label="Me gusta"
                >
                  <svg viewBox="0 0 24 24" className={`h-7 w-7 ${likesPropios[postAbierto.id] ? "heart-pop" : ""}`} fill={likesPropios[postAbierto.id] ? "var(--accent)" : "none"} stroke="var(--accent)" strokeWidth="1.8">
                    <path d="M12 21s-7.5-4.7-10-9.3C.5 8 2.5 4.5 6 4.5c2.2 0 3.7 1.2 6 3.6 2.3-2.4 3.8-3.6 6-3.6 3.5 0 5.5 3.5 4 7.2C19.5 16.3 12 21 12 21z" strokeLinejoin="round" />
                  </svg>
                  <span className="text-[12px] text-muted">
                    {postAbierto.likes + (likesPropios[postAbierto.id] ? 1 : 0)}
                  </span>
                </button>
              </div>

              {postAbierto.descripcion && (
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {postAbierto.descripcion}
                </p>
              )}

              {postAbierto.prendaIds.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {postAbierto.prendaIds.map((id) => (
                    <span key={id} className="chip">{nombreDe(id)}</span>
                  ))}
                </div>
              )}

              <button
                onClick={() => {
                  if (confirm("¿Eliminar este post de tu perfil?")) {
                    removePost(postAbierto.id);
                    setPostAbierto(null);
                  }
                }}
                className="mt-5 w-full rounded-xl border border-line bg-surface py-3 text-sm text-muted"
              >
                Eliminar post
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Menú de ajustes ── */}
      {panel === "ajustes" && (
        <div className="overlay fixed inset-0 z-50 flex items-end bg-ink/40" onClick={() => setPanel(null)}>
          <div className="sheet w-full rounded-t-3xl bg-surface p-6 pb-10" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-2xl">Ajustes</h2>
            <div className="mt-4 space-y-1">
              <button onClick={abrirEditar} className="flex w-full items-center justify-between rounded-xl px-3 py-3.5 text-left text-sm hover:bg-bg">
                Editar perfil <span className="text-muted">›</span>
              </button>
              <button onClick={() => setPanel("tema")} className="flex w-full items-center justify-between rounded-xl px-3 py-3.5 text-left text-sm hover:bg-bg">
                Tema de la app <span className="text-muted">{t.motif} {t.nombre} ›</span>
              </button>
              <button onClick={() => setPanel("plan")} className="flex w-full items-center justify-between rounded-xl px-3 py-3.5 text-left text-sm hover:bg-bg">
                Mi plan <span className="text-muted">{perfil.premium ? "Premium" : "Gratuito"} ›</span>
              </button>

              <div className="flex items-center justify-between rounded-xl px-3 py-3.5 text-sm">
                Modo oscuro
                <button
                  onClick={() => setPerfil({ modoOscuro: !perfil.modoOscuro })}
                  className={`h-6 w-11 rounded-full p-0.5 transition-colors ${perfil.modoOscuro ? "bg-accent" : "bg-line"}`}
                  aria-label="Modo oscuro"
                >
                  <span className={`block h-5 w-5 rounded-full bg-surface transition-transform ${perfil.modoOscuro ? "translate-x-5" : ""}`} />
                </button>
              </div>

              <div className="flex items-center justify-between rounded-xl px-3 py-3.5 text-sm">
                Notificaciones
                <button
                  onClick={() => setPerfil({ notificaciones: !perfil.notificaciones })}
                  className={`h-6 w-11 rounded-full p-0.5 transition-colors ${perfil.notificaciones ? "bg-accent" : "bg-line"}`}
                  aria-label="Notificaciones"
                >
                  <span className={`block h-5 w-5 rounded-full bg-surface transition-transform ${perfil.notificaciones ? "translate-x-5" : ""}`} />
                </button>
              </div>

              <div className="flex items-center justify-between rounded-xl px-3 py-3.5 text-sm">
                Perfil privado
                <button
                  onClick={() => setPerfil({ privado: !perfil.privado })}
                  className={`h-6 w-11 rounded-full p-0.5 transition-colors ${perfil.privado ? "bg-accent" : "bg-line"}`}
                  aria-label="Perfil privado"
                >
                  <span className={`block h-5 w-5 rounded-full bg-surface transition-transform ${perfil.privado ? "translate-x-5" : ""}`} />
                </button>
              </div>

              <div className="flex items-center justify-between rounded-xl px-3 py-3.5 text-sm">
                Idioma
                <div className="flex gap-1.5">
                  <button className="chip" data-active={perfil.idioma === "es"} onClick={() => setPerfil({ idioma: "es" })}>
                    Español
                  </button>
                  <button className="chip" data-active={perfil.idioma === "en"} onClick={() => setPerfil({ idioma: "en" })}>
                    English
                  </button>
                </div>
              </div>
              {perfil.idioma === "en" && (
                <p className="px-3 text-[12px] text-muted">
                  La traducción completa al inglés llegará en una próxima versión.
                </p>
              )}

              <button
                onClick={() => {
                  if (confirm("¿Cerrar sesión y borrar los datos de este dispositivo?")) {
                    localStorage.clear();
                    location.href = "/";
                  }
                }}
                className="w-full rounded-xl px-3 py-3.5 text-left text-sm text-muted hover:bg-bg"
              >
                Cerrar sesión / Reiniciar app
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Editar perfil ── */}
      {panel === "editar" && (
        <div className="overlay fixed inset-0 z-50 flex items-end bg-ink/40" onClick={() => setPanel(null)}>
          <div className="sheet w-full rounded-t-3xl bg-surface p-6 pb-10" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-2xl">Editar perfil</h2>
            <div className="mt-4 space-y-3">
              <button
                onClick={() => fotoPerfilRef.current?.click()}
                className="w-full rounded-xl border border-line bg-bg py-3 text-sm"
              >
                Cambiar foto de perfil
              </button>
              <input
                value={edNombre}
                onChange={(e) => setEdNombre(e.target.value)}
                placeholder="Tu nombre"
                className="w-full rounded-xl border border-line bg-bg px-4 py-3 text-sm outline-none focus:border-accent"
              />
              <input
                value={edUsername}
                onChange={(e) => setEdUsername(e.target.value.toLowerCase().replace(/\s+/g, "."))}
                placeholder="usuario"
                className="w-full rounded-xl border border-line bg-bg px-4 py-3 text-sm outline-none focus:border-accent"
              />
              <textarea
                value={edBio}
                onChange={(e) => setEdBio(e.target.value)}
                placeholder="Tu bio (ej. Amante del lino y los básicos ✦)"
                rows={3}
                className="w-full resize-none rounded-xl border border-line bg-bg px-4 py-3 text-sm outline-none focus:border-accent"
              />
              <div className="flex flex-wrap gap-1.5">
                {["Minimalista", "Colorida", "Elegante", "Casual", "Streetwear", "Romántica"].map((e) => (
                  <button key={e} className="chip" data-active={edEstilo === e} onClick={() => setEdEstilo(e)}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => {
                setPerfil({ nombre: edNombre.trim(), username: edUsername.trim(), bio: edBio.trim(), estilo: edEstilo });
                setPanel(null);
                avisar("Perfil actualizado");
              }}
              className="btn-primary mt-5"
            >
              Guardar
            </button>
          </div>
        </div>
      )}

      {/* ── Tema ── */}
      {panel === "tema" && (
        <div className="overlay fixed inset-0 z-50 overflow-y-auto bg-ink/40" onClick={() => setPanel(null)}>
          <div className="sheet mx-auto mt-16 max-w-md rounded-t-3xl bg-surface p-6 pb-28" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-2xl">Tema de tu boutique</h2>
            <div className="mt-4">
              <ThemePicker onUpgrade={() => setPanel("plan")} />
            </div>
          </div>
        </div>
      )}

      {/* ── Plan / Premium ── */}
      {panel === "plan" && (
        <div className="overlay fixed inset-0 z-50 overflow-y-auto bg-ink/50 backdrop-blur-sm" onClick={() => setPanel(null)}>
          <div className="sheet mx-auto mt-12 max-w-md rounded-t-3xl bg-bg px-5 pb-28 pt-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.35em] text-muted">Dressé</p>
              <h2 className="mt-1 font-display text-4xl">Premium</h2>
              <p className="mx-auto mt-2 max-w-[30ch] text-sm text-muted">
                Tu boutique, sin límites y con todos sus vestidos.
              </p>
            </div>

            <div className="mt-5 flex justify-center gap-2">
              {THEMES.filter((th) => th.premium).map((th) => (
                <div key={th.id} className="flex h-14 w-14 flex-col items-center justify-center rounded-xl border border-line" style={{ background: th.swatches[0] }}>
                  <span style={{ color: th.swatches[1] }} className="text-lg leading-none">{th.motif}</span>
                  <span className="mt-1 text-[8px] uppercase tracking-wider" style={{ color: th.swatches[1] }}>{th.nombre}</span>
                </div>
              ))}
            </div>

            <div className="card mt-6 overflow-hidden">
              {[
                ["Prendas en el armario", "20", "Ilimitadas"],
                ["Consultas al asesor", "Limitadas", "Ilimitadas"],
                ["Temas visuales", "2", "6 + detalles únicos"],
                ["Looks guardados", "Sí", "Sí"],
                ["Publicar en comunidad", "—", "Sí"],
                ["Destacados de la semana", "—", "Sí"],
              ].map(([que, gratis, prem], i) => (
                <div key={que} className={`grid grid-cols-[1.4fr_1fr_1fr] items-center px-4 py-3 text-xs ${i > 0 ? "border-t border-line" : ""}`}>
                  <span className="text-muted">{que}</span>
                  <span className="text-center">{gratis}</span>
                  <span className="text-center font-medium text-accent">{prem}</span>
                </div>
              ))}
            </div>

            {perfil.premium ? (
              <div className="mt-5 space-y-2">
                <p className="text-center text-sm text-muted">Ya eres Premium {t.motif}</p>
                <button
                  onClick={() => {
                    setPerfil({ premium: false });
                    setPanel(null);
                  }}
                  className="w-full rounded-[14px] border border-line bg-surface py-3.5 text-sm text-muted"
                >
                  Cancelar suscripción
                </button>
              </div>
            ) : (
              <div className="mt-5 space-y-2">
                <button
                  onClick={() => {
                    setPerfil({ premium: true });
                    setPanel(null);
                  }}
                  className="btn-primary"
                >
                  Premium mensual — 4,99 €/mes
                </button>
                <button
                  onClick={() => {
                    setPerfil({ premium: true });
                    setPanel(null);
                  }}
                  className="w-full rounded-[14px] border border-accent bg-accentSoft py-3.5 text-sm"
                >
                  Premium anual — 39,99 €/año <span className="text-muted">(2 meses gratis)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Publicar outfit ── */}
      {panel === "publicar" && (
        <div className="overlay fixed inset-0 z-50 overflow-y-auto bg-ink/40" onClick={() => setPanel(null)}>
          <div className="sheet mx-auto mt-16 max-w-md rounded-t-3xl bg-surface p-6 pb-28" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-2xl">Publicar outfit</h2>

            <input
              ref={pubCamRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) leerFotoPost(f);
                e.target.value = "";
              }}
            />
            <input
              ref={pubGalRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) leerFotoPost(f);
                e.target.value = "";
              }}
            />

            {!pubFoto ? (
              <div className="mt-4 space-y-2">
                <button onClick={() => pubCamRef.current?.click()} className="btn-primary">
                  Hacer una foto
                </button>
                <button
                  onClick={() => pubGalRef.current?.click()}
                  className="w-full rounded-[14px] border border-line bg-bg py-3.5 text-sm"
                >
                  Elegir de la galería
                </button>
              </div>
            ) : (
              <>
                <div className="relative mt-4 overflow-hidden rounded-2xl border border-line">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={pubFoto} alt="Tu outfit" className="max-h-64 w-full object-cover" />
                  <button
                    onClick={() => setPubFoto(null)}
                    className="btn-cerrar absolute right-3 top-3"
                    aria-label="Quitar foto"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>

                <input
                  value={pubTitulo}
                  onChange={(e) => setPubTitulo(e.target.value)}
                  placeholder="Título del outfit"
                  className="mt-3 w-full rounded-xl border border-line bg-bg px-4 py-3 text-sm outline-none focus:border-accent"
                />
                <textarea
                  value={pubDesc}
                  onChange={(e) => setPubDesc(e.target.value)}
                  placeholder="Descripción (opcional)"
                  rows={2}
                  className="mt-2 w-full resize-none rounded-xl border border-line bg-bg px-4 py-3 text-sm outline-none focus:border-accent"
                />

                <p className="mt-3 text-xs uppercase tracking-[0.25em] text-muted">
                  Prendas del look (opcional)
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {prendas.map((p) => {
                    const sel = pubPrendas.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        className="chip"
                        data-active={sel}
                        onClick={() =>
                          setPubPrendas(sel ? pubPrendas.filter((id) => id !== p.id) : [...pubPrendas, p.id])
                        }
                      >
                        {p.nombre}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={publicar}
                  disabled={!pubTitulo.trim()}
                  className="btn-primary mt-5"
                >
                  Publicar
                </button>
              </>
            )}
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
              {listaAbierta.gente.map((g, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (g.id) {
                      setListaAbierta(null);
                      setPerfilVisitado(g.id);
                    }
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
                  <span className="ml-auto text-muted">›</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tablero abierto */}
      {tableroAbierto && (
        <div className="overlay fixed inset-0 z-[60] overflow-y-auto bg-ink/50 backdrop-blur-sm" onClick={() => setTableroAbierto(null)}>
          <div className="sheet mx-auto mt-14 min-h-[60vh] max-w-md rounded-t-3xl bg-bg px-5 pb-28 pt-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-3xl">{tableroAbierto.nombre}</h2>
                <p className="text-[12px] text-muted">{postsTablero.length} looks guardados</p>
              </div>
              <button onClick={() => setTableroAbierto(null)} className="btn-cerrar shrink-0" aria-label="Cerrar">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="mt-3 flex gap-2">
              <button
                onClick={() => {
                  const nuevo = prompt("Nuevo nombre del tablero:", tableroAbierto.nombre);
                  if (nuevo?.trim()) {
                    renameTablero(tableroAbierto.id, nuevo.trim());
                    setTableroAbierto({ ...tableroAbierto, nombre: nuevo.trim() });
                  }
                }}
                className="chip"
              >
                Renombrar
              </button>
              <button
                onClick={() => {
                  setTableroPrivado(tableroAbierto.id, !tableroAbierto.privado);
                  setTableroAbierto({ ...tableroAbierto, privado: !tableroAbierto.privado });
                }}
                className="chip"
                data-active={tableroAbierto.privado}
              >
                {tableroAbierto.privado ? "Privado 🔒" : "Público"}
              </button>
              <button
                onClick={() => {
                  if (confirm(`¿Eliminar el tablero “${tableroAbierto.nombre}”?`)) {
                    removeTablero(tableroAbierto.id);
                    setTableroAbierto(null);
                  }
                }}
                className="chip ml-auto"
              >
                Eliminar
              </button>
            </div>

            <div className="masonry mt-4">
              {postsTablero.map((p, i) => (
                <div key={p.id} className="card overflow-hidden">
                  <div className="flex w-full items-center justify-center overflow-hidden" style={{ height: [200, 250, 170, 230][i % 4], background: t.tile }}>
                    {p.imagen ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imagen} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-3xl">{t.motif}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between px-3 py-2">
                    <p className="truncate font-display text-sm">{p.titulo}</p>
                    <button
                      onClick={() => {
                        quitarDeTablero(tableroAbierto.id, p.id);
                        setPostsTablero((prev) => prev.filter((x) => x.id !== p.id));
                      }}
                      className="shrink-0 text-[12px] text-muted underline underline-offset-2"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              ))}
              {postsTablero.length === 0 && (
                <p className="py-8 text-sm text-muted">
                  Este tablero está vacío. Guarda looks desde la comunidad.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Perfil de otra persona desde tus listas */}
      {perfilVisitado && (
        <PerfilPublico usuarioId={perfilVisitado} onCerrar={() => setPerfilVisitado(null)} />
      )}

      {toast && <Toast mensaje={toast} />}
      <BottomNav />
    </main>
  );
}
