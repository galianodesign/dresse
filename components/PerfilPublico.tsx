"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useStore } from "@/lib/store";
import { getTheme } from "@/lib/themes";
import { Flourish } from "@/components/ThemeDecor";
import { useLockScroll } from "@/lib/useLockScroll";

interface Datos {
  username: string;
  nombre: string;
  foto: string | null;
  privado: boolean;
  seguidores: number;
  siguiendo: number;
}

interface MiniPost {
  id: string;
  titulo: string;
  imagen: string | null;
  likes: number;
}

/**
 * Perfil público navegable (modelo Instagram/TikTok): se abre desde
 * cualquier lista de seguidores/seguidos y permite seguir navegando
 * de perfil en perfil.
 */
export default function PerfilPublico({
  usuarioId,
  onCerrar,
}: {
  usuarioId: string;
  onCerrar: () => void;
}) {
  const supabase = createClient();
  const { user, theme, seguidos, toggleSeguir, solicitudesEnviadas, solicitarSeguir, cancelarSolicitud } = useStore();
  const t = getTheme(theme);

  const [actual, setActual] = useState(usuarioId);
  const [datos, setDatos] = useState<Datos | null>(null);
  const [posts, setPosts] = useState<MiniPost[]>([]);
  const [lista, setLista] = useState<{ titulo: string; gente: { id: string; username: string; foto: string | null }[] } | null>(null);
  const [postAbierto, setPostAbierto] = useState<MiniPost | null>(null);

  useLockScroll(true);

  useEffect(() => {
    cargar(actual);
  }, [actual]);

  async function cargar(id: string) {
    setDatos(null);
    setPosts([]);
    const [{ data: p }, fc, fg, po, lk] = await Promise.all([
      supabase.from("perfiles").select("username, nombre, foto_url, privado").eq("id", id).single(),
      supabase.from("seguidores").select("seguidor_id", { count: "exact", head: true }).eq("seguido_id", id),
      supabase.from("seguidores").select("seguido_id", { count: "exact", head: true }).eq("seguidor_id", id),
      supabase.from("posts").select("id, titulo, imagen_url").eq("usuario_id", id).order("creado_en", { ascending: false }).limit(30),
      supabase.from("post_likes").select("post_id"),
    ]);
    const likesPor: Record<string, number> = {};
    (lk.data || []).forEach((l: any) => {
      likesPor[l.post_id] = (likesPor[l.post_id] || 0) + 1;
    });
    setDatos({
      username: p?.username || "dresse",
      nombre: p?.nombre || "",
      foto: p?.foto_url || null,
      privado: !!p?.privado,
      seguidores: fc.count || 0,
      siguiendo: fg.count || 0,
    });
    setPosts(
      (po.data || []).map((r: any) => ({
        id: r.id,
        titulo: r.titulo,
        imagen: r.imagen_url,
        likes: likesPor[r.id] || 0,
      }))
    );
  }

  async function abrirLista(titulo: string, tipo: "seguidores" | "seguidos") {
    const col = tipo === "seguidores" ? "seguido_id" : "seguidor_id";
    const otra = tipo === "seguidores" ? "seguidor_id" : "seguido_id";
    const { data: rows } = await supabase.from("seguidores").select(otra).eq(col, actual);
    const ids = (rows || []).map((r: any) => r[otra]);
    if (!ids.length) {
      setLista({ titulo, gente: [] });
      return;
    }
    const { data: perfs } = await supabase.from("perfiles").select("id, username, foto_url").in("id", ids);
    setLista({
      titulo,
      gente: (perfs || []).map((p: any) => ({ id: p.id, username: p.username || "dresse", foto: p.foto_url })),
    });
  }

  const esYo = user?.id === actual;
  const loSigo = seguidos.includes(actual);
  const solicitado = solicitudesEnviadas.includes(actual);
  const puedeVer = esYo || !datos?.privado || loSigo;

  return (
    <div className="overlay fixed inset-0 z-[80] overflow-y-auto bg-ink/50 backdrop-blur-sm" onClick={onCerrar}>
      <div className="sheet mx-auto mt-14 min-h-[60vh] max-w-md rounded-t-3xl bg-bg px-5 pb-28 pt-6" onClick={(e) => e.stopPropagation()}>
        {!datos ? (
          <p className="py-14 text-center text-sm text-muted">{t.motif} Cargando…</p>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full font-display text-2xl" style={{ background: t.tile }}>
                {datos.foto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={datos.foto} alt="" className="h-full w-full object-cover" />
                ) : (
                  datos.username[0]?.toUpperCase() || "D"
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-2xl">@{datos.username}</p>
                <div className="mt-0.5 flex gap-4 text-xs text-muted">
                  <button
                    disabled={!puedeVer}
                    onClick={() => abrirLista("Seguidores", "seguidores")}
                    className={puedeVer ? "underline underline-offset-2" : "opacity-70"}
                  >
                    {datos.seguidores} seguidores
                  </button>
                  <button
                    disabled={!puedeVer}
                    onClick={() => abrirLista("Seguidos", "seguidos")}
                    className={puedeVer ? "underline underline-offset-2" : "opacity-70"}
                  >
                    {datos.siguiendo} seguidos
                  </button>
                </div>
                {datos.privado && (
                  <p className="mt-1 flex items-center gap-1 text-[12px] text-muted">
                    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="5" y="11" width="14" height="9" rx="2" />
                      <path d="M8 11V8a4 4 0 018 0v3" />
                    </svg>
                    Cuenta privada
                  </p>
                )}
              </div>
              <button onClick={onCerrar} className="btn-cerrar shrink-0" aria-label="Cerrar">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {!esYo && (
              <button
                onClick={() => {
                  if (loSigo) {
                    toggleSeguir(actual);
                    setDatos({ ...datos, seguidores: Math.max(0, datos.seguidores - 1) });
                  } else if (solicitado) {
                    cancelarSolicitud(actual);
                  } else if (datos.privado) {
                    solicitarSeguir(actual);
                  } else {
                    toggleSeguir(actual);
                    setDatos({ ...datos, seguidores: datos.seguidores + 1 });
                  }
                }}
                className={`mt-4 w-full rounded-xl py-3 text-sm ${
                  loSigo || solicitado ? "border border-line bg-surface text-muted" : "bg-ink text-bg"
                }`}
              >
                {loSigo ? "Siguiendo" : solicitado ? "Solicitado · toca para cancelar" : datos.privado ? "Solicitar seguir" : "Seguir"}
              </button>
            )}

            <h3 className="mt-6 text-xs uppercase tracking-[0.25em] text-muted">Sus looks</h3>
            {!puedeVer ? (
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
                {posts.map((p, i) => (
                  <button key={p.id} onClick={() => setPostAbierto(p)} className="card block w-full overflow-hidden text-left">
                    <div className="flex w-full items-center justify-center overflow-hidden" style={{ height: [170, 220, 150, 200][i % 4], background: t.tile }}>
                      {p.imagen ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.imagen} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-3xl">{t.motif}</span>
                      )}
                    </div>
                    <div className="px-3 py-2">
                      <p className="truncate font-display text-sm">{p.titulo}</p>
                      <p className="text-[12px] text-muted">♥ {p.likes}</p>
                    </div>
                  </button>
                ))}
                {posts.length === 0 && <p className="py-8 text-sm text-muted">Aún no ha publicado looks.</p>}
              </div>
            )}
          </>
        )}

        {/* Lista anidada: tocar a alguien navega a su perfil */}
        {lista && (
          <div className="overlay fixed inset-0 z-[90] flex items-end bg-ink/40" onClick={() => setLista(null)}>
            <div className="sheet max-h-[70vh] w-full overflow-y-auto rounded-t-3xl bg-surface p-6 pb-10" onClick={(e) => e.stopPropagation()}>
              <h2 className="font-display text-2xl">{lista.titulo}</h2>
              <div className="mt-4 space-y-2">
                {lista.gente.length === 0 && <p className="text-sm text-muted">Nadie por aquí todavía.</p>}
                {lista.gente.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => {
                      setLista(null);
                      setPostAbierto(null);
                      setActual(g.id);
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

        {/* Visor simple de post */}
        {postAbierto && (
          <div className="overlay fixed inset-0 z-[90] flex items-center justify-center bg-ink/70 p-5" onClick={() => setPostAbierto(null)}>
            <div className="sheet w-full max-w-sm overflow-hidden rounded-3xl bg-bg" onClick={(e) => e.stopPropagation()}>
              <div className="relative flex max-h-[60vh] items-center justify-center overflow-hidden" style={{ background: t.tile }}>
                {postAbierto.imagen ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={postAbierto.imagen} alt="" className="max-h-[60vh] w-full object-contain" />
                ) : (
                  <span className="py-20 text-5xl">{t.motif}</span>
                )}
                <button onClick={() => setPostAbierto(null)} className="btn-cerrar absolute right-3 top-3" aria-label="Cerrar">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <div className="p-4">
                <p className="font-display text-lg">{postAbierto.titulo}</p>
                <p className="text-[12px] text-muted">♥ {postAbierto.likes}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
