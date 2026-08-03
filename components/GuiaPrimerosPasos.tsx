"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { t, ClaveTexto } from "@/lib/i18n";

/**
 * Guía de primeros pasos del armario.
 *
 * Sustituye al armario vacío sin explicación: tres pasos que se marcan solos
 * a medida que la usuaria los completa. Desaparece sola al terminar los tres,
 * y se puede ocultar a mano (se recuerda en el propio móvil).
 */

const OCULTA_KEY = "dresse.guia.oculta";

interface Props {
  /** Abre el selector de foto para añadir una prenda */
  onAnadirPrenda: () => void;
  /** Abre el panel de crear look */
  onCrearLook: () => void;
}

export default function GuiaPrimerosPasos({ onAnadirPrenda, onCrearLook }: Props) {
  const { prendas, looks, historial, perfil, ready } = useStore();
  const router = useRouter();
  const [oculta, setOculta] = useState(true); // true hasta leer el móvil, evita parpadeo

  useEffect(() => {
    try {
      setOculta(localStorage.getItem(OCULTA_KEY) === "1");
    } catch {
      setOculta(false);
    }
  }, []);

  const tx = (clave: ClaveTexto) => t(perfil.idioma, clave);

  const pasos = [
    {
      clave: "guiaPaso1" as ClaveTexto,
      ayuda: "guiaPaso1Ayuda" as ClaveTexto,
      hecho: prendas.length > 0,
      activable: true,
      accion: onAnadirPrenda,
    },
    {
      clave: "guiaPaso2" as ClaveTexto,
      ayuda: "guiaPaso2Ayuda" as ClaveTexto,
      hecho: looks.length > 0,
      activable: prendas.length >= 2,
      accion: onCrearLook,
    },
    {
      clave: "guiaPaso3" as ClaveTexto,
      ayuda: "guiaPaso3Ayuda" as ClaveTexto,
      hecho: historial.length > 0,
      activable: true,
      accion: () => router.push("/asesor"),
    },
  ];

  const completados = pasos.filter((p) => p.hecho).length;

  // Nada que guiar: aún cargando, ya está todo hecho, o la ocultó a mano
  if (!ready || oculta || completados === pasos.length) return null;

  function ocultar() {
    try {
      localStorage.setItem(OCULTA_KEY, "1");
    } catch {}
    setOculta(true);
  }

  return (
    <section className="card rise mb-5 p-5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted">
          {tx("guiaTitulo")}
        </p>
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
          {completados}/{pasos.length} {tx("guiaCompletado")}
        </p>
      </div>

      <ul className="mt-4 space-y-1">
        {pasos.map((p) => {
          const pendiente = !p.hecho && p.activable;
          return (
            <li key={p.clave}>
              <button
                onClick={pendiente ? p.accion : undefined}
                disabled={!pendiente}
                className="flex w-full items-start gap-3 rounded-xl py-2 text-left disabled:opacity-100"
              >
                <span
                  className="mt-[3px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border"
                  style={{
                    borderColor: p.hecho ? "var(--accent)" : "var(--line)",
                    background: p.hecho ? "var(--accent)" : "transparent",
                  }}
                  aria-hidden
                >
                  {p.hecho && (
                    <svg
                      viewBox="0 0 24 24"
                      className="h-3 w-3"
                      fill="none"
                      stroke="var(--surface)"
                      strokeWidth="3.4"
                    >
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span
                    className={`block text-sm leading-snug ${
                      p.hecho ? "text-muted" : "text-ink"
                    }`}
                  >
                    {tx(p.clave)}
                  </span>
                  {!p.hecho && (
                    <span className="mt-0.5 block text-[12px] leading-snug text-muted">
                      {tx(p.ayuda)}
                    </span>
                  )}
                </span>

                {pendiente && (
                  <svg
                    viewBox="0 0 24 24"
                    className="mt-1 h-4 w-4 shrink-0 text-muted"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden
                  >
                    <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <button
        onClick={ocultar}
        className="mt-3 text-[11px] uppercase tracking-[0.18em] text-muted underline underline-offset-4"
      >
        {tx("guiaOcultar")}
      </button>
    </section>
  );
}
