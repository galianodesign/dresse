"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import Header from "@/components/Header";
import { useStore } from "@/lib/store";
import { comprimirADataUrl } from "@/lib/imagen";
import { getTheme } from "@/lib/themes";
import { SectionBackdrop } from "@/components/ThemeDecor";
import Toast from "@/components/Toast";

interface Veredicto {
  compra: boolean;
  resumen: string;
  combinaciones: { titulo: string; prendaIds: string[] }[];
  aviso?: string;
}

interface Propuesta {
  intro?: string;
  outfits: { titulo: string; prendaIds: string[]; porque?: string }[];
}

export default function Asesor() {
  const { prendas, perfil, theme, historial, addAnalisis, wishlist, addWish, removeWish, addLook } = useStore();
  const t = getTheme(theme);

  const [foto, setFoto] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [veredicto, setVeredicto] = useState<Veredicto | null>(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [enWishlist, setEnWishlist] = useState(false);
  const [vista, setVista] = useState<"comprar" | "vestirme">("comprar");
  const [ocasion, setOcasion] = useState("");
  const [generando, setGenerando] = useState(false);
  const [propuesta, setPropuesta] = useState<Propuesta | null>(null);
  const [errorOutfits, setErrorOutfits] = useState("");
  const camaraRef = useRef<HTMLInputElement>(null);
  const galeriaRef = useRef<HTMLInputElement>(null);

  function reset() {
    setFoto(null);
    setVeredicto(null);
    setError("");
    setCargando(false);
    setEnWishlist(false);
  }

  function avisar(msg: string) {
    setToast("");
    // setTimeout y no requestAnimationFrame: si la pantalla no esta
    // pintando fotogramas (app en segundo plano, pestana oculta) rAF no llega
    // a ejecutarse nunca y el aviso no aparece. Con avisos de error eso
    // significa fallar en silencio, que es justo lo que se quiere evitar.
    setTimeout(() => setToast(msg), 0);
    setTimeout(() => setToast(""), 1900);
  }

  function leerArchivo(f: File) {
    const r = new FileReader();
    r.onload = () => {
      const url = r.result as string;
      setVeredicto(null);
      setError("");
      setFoto(url);
      analizar(url);
    };
    r.readAsDataURL(f);
  }

  async function analizar(dataUrl: string) {
    setCargando(true);
    try {
      // Reducir antes de enviar: una foto de iPhone a resolución completa
      // supera el límite de 4,5 MB de Vercel y la petición muere con un 413.
      const paraIA = await comprimirADataUrl(dataUrl);
      const res = await fetch("/api/asesor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modo: "asesorar",
          imagen: paraIA,
          estilo: perfil.estilo,
          armario: prendas.map((p) => ({
            // El id permite saber con certeza a qué prenda se refiere cada
            // combinación. Antes iban por nombre y dos prendas parecidas se
            // volvían indistinguibles.
            id: p.id,
            nombre: p.nombre,
            categoria: p.categoria,
            color: p.color,
            estilo: p.estilo,
            // Para que vea tu ropa de verdad al juzgar si la prenda encaja:
            // toda la pregunta es si combina con lo que ya tienes.
            imagen: p.imagen,
          })),
        }),
      });
      if (!res.ok) {
        // El servidor explica el motivo (sesión caducada, cupo diario
        // agotado). Decir solo "no se pudo" deja a la usuaria sin saber si
        // insistir o esperar.
        const motivo = await res.json().catch(() => null);
        setError(motivo?.error || "No se pudo analizar la prenda. Inténtalo de nuevo.");
        setCargando(false);
        return;
      }
      const v = await res.json();
      setVeredicto(v);
      addAnalisis({
        id: `a${Date.now()}`,
        fecha: new Date().toISOString(),
        compra: !!v.compra,
        resumen: v.resumen || "",
        imagen: dataUrl,
      });
    } catch {
      setError("No se pudo analizar la prenda. Inténtalo de nuevo.");
    }
    setCargando(false);
  }

  async function pedirOutfits(oc: string) {
    if (prendas.length < 2) {
      setErrorOutfits("Necesitas al menos dos prendas en tu armario.");
      return;
    }
    setGenerando(true);
    setErrorOutfits("");
    setPropuesta(null);
    try {
      const res = await fetch("/api/asesor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modo: "outfits",
          ocasion: oc,
          estilo: perfil.estilo,
          armario: prendas.map((p) => ({
            id: p.id,
            nombre: p.nombre,
            categoria: p.categoria,
            color: p.color,
            estilo: p.estilo,
            // La URL pública de la foto: con esto Madame Dressé ve la prenda
            // de verdad en vez de fiarse solo del nombre y el color.
            imagen: p.imagen,
          })),
        }),
      });
      const data = await res.json();
      if (data.error) {
        setErrorOutfits(data.error);
      } else {
        setPropuesta(data);
      }
    } catch {
      setErrorOutfits("No se pudo crear la propuesta. Inténtalo de nuevo.");
    }
    setGenerando(false);
  }

  return (
    <main className="relative mx-auto max-w-md px-5 pb-28 pt-8">
      <SectionBackdrop seccion="asesor" />
      <Header
        titulo="Madame Dressé"
        subtitulo="Tu estilista personal. Te dice qué comprar y qué ponerte, con lo que ya tienes."
      />

      {/* El reglamento europeo de IA obliga a decir claramente que quien
          responde es una máquina, ahí donde se interactúa con ella y no
          escondido en un documento legal que nadie abre. */}
      <p className="mb-5 rounded-[var(--radius-card)] border border-line bg-[var(--accent-soft)] px-4 py-3 text-xs leading-relaxed text-muted">
        Madame Dressé es una inteligencia artificial, no una persona. Puede
        equivocarse, y tus fotos se envían a analizar para poder responderte.{" "}
        <Link href="/legal/privacidad" className="underline hover:text-ink">
          Cómo funciona
        </Link>
      </p>

      {/* Qué necesitas hoy */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setVista("comprar")}
          className="chip flex-1 justify-center"
          data-active={vista === "comprar"}
        >
          ¿Me lo compro?
        </button>
        <button
          onClick={() => setVista("vestirme")}
          className="chip flex-1 justify-center"
          data-active={vista === "vestirme"}
        >
          ¿Qué me pongo?
        </button>
      </div>

      {/* Inputs ocultos: cámara y galería por separado */}
      <input
        ref={camaraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) leerArchivo(f);
          e.target.value = "";
        }}
      />
      <input
        ref={galeriaRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) leerArchivo(f);
          e.target.value = "";
        }}
      />

      {vista === "comprar" && !foto && (
        <div className="rise space-y-3">
          <div className="hang-tag flex flex-col items-center gap-2 px-6 pb-8 pt-14 text-center">
            <span className="text-3xl">{t.motif}</span>
            <span className="font-display text-xl">
              ¿Has visto algo que te gusta?
            </span>
            <span className="max-w-[30ch] text-xs leading-relaxed text-muted">
              Hazle una foto en la tienda o sube una captura de pantalla de
              una tienda online.
            </span>
          </div>

          <button
            onClick={() => camaraRef.current?.click()}
            className="btn-primary flex items-center justify-center gap-2"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M3 8a2 2 0 012-2h1.5l1.2-1.8A2 2 0 019.4 3h5.2a2 2 0 011.7 1.2L17.5 6H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="12.5" r="3.5" />
            </svg>
            Hacer una foto
          </button>

          <button
            onClick={() => galeriaRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-line bg-surface py-3.5 text-sm tracking-wide"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="9" cy="9" r="2" />
              <path d="M21 15l-5-5-9 9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Elegir de la galería
          </button>

          {vista === "comprar" && wishlist.length > 0 && (
            <div className="pt-3">
              <h3 className="text-xs uppercase tracking-[0.25em] text-muted">
                Tu wishlist
              </h3>
              <div className="mt-2 space-y-2">
                {wishlist.map((w) => (
                  <div key={w.id} className="card flex items-center gap-3 p-3">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-accentSoft">
                      {w.imagen && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={w.imagen} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs text-muted">{w.nota || "Sin nota"}</p>
                      <p className="text-[12px] text-muted">
                        {new Date(w.fecha).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    <button
                      onClick={() => removeWish(w.id)}
                      className="shrink-0 text-[12px] text-muted underline underline-offset-2"
                    >
                      Quitar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {vista === "comprar" && historial.length > 0 && (
            <div className="pt-3">
              <h3 className="text-xs uppercase tracking-[0.25em] text-muted">
                Últimos análisis
              </h3>
              <div className="mt-2 space-y-2">
                {historial.map((h) => (
                  <div key={h.id} className="card flex items-center gap-3 p-3">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-accentSoft">
                      {h.imagen && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={h.imagen} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium">
                        {h.compra ? "✓ Cómpralo" : "✕ Piénsalo"}
                        <span className="ml-2 font-normal text-muted">
                          {new Date(h.fecha).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                        </span>
                      </p>
                      <p className="truncate text-xs text-muted">{h.resumen}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {vista === "comprar" && foto && (
        <div className="rise space-y-4">
          <div className="relative overflow-hidden rounded-2xl border border-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={foto} alt="Prenda a analizar" className="max-h-72 w-full object-cover" />
            {/* Quitar / cambiar la foto en cualquier momento */}
            <button
              onClick={reset}
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-ink/60 text-bg"
              aria-label="Quitar foto"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => camaraRef.current?.click()}
              className="flex-1 rounded-xl border border-line bg-surface py-3 text-xs text-muted"
            >
              Otra foto
            </button>
            <button
              onClick={() => galeriaRef.current?.click()}
              className="flex-1 rounded-xl border border-line bg-surface py-3 text-xs text-muted"
            >
              Otra de galería
            </button>
          </div>

          {vista === "comprar" && cargando && (
            <div className="card p-5 text-center">
              <p className="text-sm text-muted">
                {t.motif} Consultando con tu armario…
              </p>
            </div>
          )}

          {vista === "comprar" && error && (
            <div className="card p-5 text-center">
              <p className="text-sm text-muted">{error}</p>
            </div>
          )}

          {vista === "comprar" && veredicto && (
            <div className="space-y-4">
              <div
                className={`rounded-2xl border p-5 ${
                  veredicto.compra ? "border-accent bg-accentSoft" : "border-line bg-surface"
                }`}
              >
                <p className="text-xs uppercase tracking-[0.25em] text-muted">
                  {t.motif} Veredicto Dressé
                </p>
                <p className="mt-2 font-display text-2xl leading-snug">
                  {veredicto.compra ? "Cómpralo. Te lo vas a poner." : "Piénsalo dos veces."}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {veredicto.resumen}
                </p>
              </div>

              {veredicto.combinaciones.map((c, i) => {
                const piezas = (c.prendaIds || [])
                  .map((id) => prendas.find((p) => p.id === id))
                  .filter((p): p is NonNullable<typeof p> => !!p);
                return (
                  <div key={i} className="hang-tag px-4 py-4 pt-7">
                    <p className="font-display text-lg">{c.titulo}</p>
                    <p className="mt-1 text-sm text-muted">
                      {piezas.map((p) => p.nombre).join(" + ")}
                    </p>
                    {/* Ahora que van por id se pueden enseñar las prendas de
                        verdad, igual que en "qué me pongo". */}
                    {piezas.some((p) => p.imagen) && (
                      <div className="mt-3 flex gap-2 overflow-x-auto">
                        {piezas.map(
                          (p) =>
                            p.imagen && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                key={p.id}
                                src={p.imagen}
                                alt={p.nombre}
                                className="h-20 w-20 shrink-0 rounded-lg object-cover"
                              />
                            )
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {veredicto.aviso && (
                <p className="text-xs leading-relaxed text-muted">{veredicto.aviso}</p>
              )}

              {!enWishlist && (
                <button
                  onClick={() => {
                    addWish({
                      id: `w${Date.now()}`,
                      imagen: foto,
                      nota: veredicto.resumen.slice(0, 80),
                      fecha: new Date().toISOString(),
                    });
                    setEnWishlist(true);
                    avisar("Guardado en tu wishlist");
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-accent bg-accentSoft py-3.5 text-sm"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="var(--accent)" strokeWidth="1.8">
                    <path d="M6 3h12v18l-6-4-6 4V3z" strokeLinejoin="round" />
                  </svg>
                  Guardar en wishlist y decidir después
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {toast && <Toast mensaje={toast} />}
      {/* ── ¿Qué me pongo? Outfits con tu propio armario ── */}
      {vista === "vestirme" && (
        <div className="rise space-y-4">
          {prendas.length < 2 ? (
            <div className="card p-6 text-center">
              <p className="font-display text-xl">Tu armario está casi vacío</p>
              <p className="mx-auto mt-2 max-w-[30ch] text-sm leading-relaxed text-muted">
                Añade al menos dos prendas y Madame Dressé empezará a vestirte
                con lo que ya tienes.
              </p>
            </div>
          ) : (
            <>
              <div className="card p-5">
                <p className="text-[11px] uppercase tracking-[0.22em] text-muted">
                  Dime el plan
                </p>
                <p className="mt-1 font-display text-xl leading-snug">
                  ¿Adónde vas?
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    "Día de oficina",
                    "Cena con amigas",
                    "Plan de domingo",
                    "Una boda",
                    "Primera cita",
                    "Viaje de fin de semana",
                  ].map((o) => (
                    <button
                      key={o}
                      onClick={() => {
                        setOcasion(o);
                        pedirOutfits(o);
                      }}
                      className="chip"
                      data-active={ocasion === o}
                    >
                      {o}
                    </button>
                  ))}
                </div>

                <div className="mt-4 flex gap-2">
                  <input
                    value={ocasion}
                    onChange={(e) => setOcasion(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && pedirOutfits(ocasion)}
                    placeholder="O escríbelo tú: cumpleaños, playa…"
                    className="min-w-0 flex-1 rounded-2xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-ink"
                  />
                  <button
                    onClick={() => pedirOutfits(ocasion)}
                    disabled={generando}
                    className="shrink-0 rounded-full bg-ink px-5 text-[12px] font-semibold uppercase tracking-[0.04em] text-surface disabled:opacity-40"
                  >
                    Vestirme
                  </button>
                </div>
              </div>

              {generando && (
                <div className="card p-8 text-center">
                  <p className="font-display text-xl">Revisando tu armario…</p>
                  <p className="mt-1 text-sm text-muted">
                    Madame Dressé está combinando tus prendas.
                  </p>
                </div>
              )}

              {errorOutfits && (
                <div className="card p-5">
                  <p className="text-sm text-muted">{errorOutfits}</p>
                </div>
              )}

              {propuesta && (
                <div className="space-y-4">
                  {propuesta.intro && (
                    <p className="px-1 text-sm leading-relaxed text-muted">
                      {propuesta.intro}
                    </p>
                  )}

                  {propuesta.outfits.map((o, i) => {
                    const piezas = o.prendaIds
                      .map((id) => prendas.find((p) => p.id === id))
                      .filter(Boolean) as typeof prendas;
                    return (
                      <div key={i} className="card overflow-hidden">
                        <div className="flex gap-2 p-3" style={{ background: t.tile }}>
                          {piezas.map((p) => (
                            <div
                              key={p.id}
                              className="flex h-24 flex-1 items-center justify-center overflow-hidden rounded-xl bg-surface"
                            >
                              {p.imagen ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={p.imagen} alt={p.nombre} className="h-full w-full object-cover" />
                              ) : (
                                <span className="text-2xl">{t.motif}</span>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="p-4">
                          <p className="font-display text-xl leading-snug">{o.titulo}</p>
                          <p className="mt-1 text-[12px] text-muted">
                            {piezas.map((p) => p.nombre).join(" · ")}
                          </p>
                          {o.porque && (
                            <p className="mt-2 text-sm leading-relaxed text-muted">
                              {o.porque}
                            </p>
                          )}
                          <button
                            onClick={() => {
                              addLook({
                                id: `l${Date.now()}`,
                                nombre: o.titulo,
                                prendaIds: piezas.map((p) => p.id),
                                creado: new Date().toISOString(),
                              });
                              avisar("Guardado en tus looks");
                            }}
                            className="mt-3 w-full rounded-full border-[1.5px] border-ink py-3 text-[12px] font-semibold uppercase tracking-[0.04em]"
                          >
                            Guardar este look
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      <BottomNav />
    </main>
  );
}
