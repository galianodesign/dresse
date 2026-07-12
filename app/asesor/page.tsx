"use client";

import { useRef, useState } from "react";
import BottomNav from "@/components/BottomNav";
import Header from "@/components/Header";
import { useStore } from "@/lib/store";
import { getTheme } from "@/lib/themes";
import { SectionBackdrop } from "@/components/ThemeDecor";
import Toast from "@/components/Toast";

interface Veredicto {
  compra: boolean;
  resumen: string;
  combinaciones: { titulo: string; prendas: string[] }[];
  aviso?: string;
}

export default function Asesor() {
  const { prendas, perfil, theme, historial, addAnalisis, wishlist, addWish, removeWish } = useStore();
  const t = getTheme(theme);

  const [foto, setFoto] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [veredicto, setVeredicto] = useState<Veredicto | null>(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [enWishlist, setEnWishlist] = useState(false);
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
    requestAnimationFrame(() => setToast(msg));
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
      const res = await fetch("/api/asesor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modo: "asesorar",
          imagen: dataUrl,
          estilo: perfil.estilo,
          armario: prendas.map((p) => ({
            nombre: p.nombre,
            categoria: p.categoria,
            color: p.color,
            estilo: p.estilo,
          })),
        }),
      });
      if (!res.ok) throw new Error();
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

  return (
    <main className="relative mx-auto max-w-md px-5 pb-28 pt-8">
      <SectionBackdrop seccion="asesor" />
      <Header
        titulo="Asesor"
        subtitulo="Antes de comprar, comprueba si combina con lo que ya tienes."
      />

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

      {!foto && (
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
            className="flex w-full items-center justify-center gap-2 rounded-[14px] border border-line bg-surface py-3.5 text-sm tracking-wide"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="9" cy="9" r="2" />
              <path d="M21 15l-5-5-9 9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Elegir de la galería
          </button>

          {wishlist.length > 0 && (
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

          {historial.length > 0 && (
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

      {foto && (
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

          {cargando && (
            <div className="card p-5 text-center">
              <p className="text-sm text-muted">
                {t.motif} Consultando con tu armario…
              </p>
            </div>
          )}

          {error && (
            <div className="card p-5 text-center">
              <p className="text-sm text-muted">{error}</p>
            </div>
          )}

          {veredicto && (
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

              {veredicto.combinaciones.map((c, i) => (
                <div key={i} className="hang-tag px-4 py-4 pt-7">
                  <p className="font-display text-lg">{c.titulo}</p>
                  <p className="mt-1 text-sm text-muted">{c.prendas.join(" + ")}</p>
                </div>
              ))}

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
                  className="flex w-full items-center justify-center gap-2 rounded-[14px] border border-accent bg-accentSoft py-3.5 text-sm"
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
      <BottomNav />
    </main>
  );
}
