"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";

/**
 * Aviso de que algo no se pudo guardar en la nube.
 *
 * Va en el layout para que aparezca desde cualquier pantalla: los fallos de
 * guardado ocurren en el store, que no sabe en qué página está la usuaria.
 *
 * Antes estos errores se descartaban con `.then(() => {})`, así que la app
 * seguía mostrando el cambio como si estuviera guardado. Este aviso existe
 * para que eso no vuelva a pasar sin que nadie se entere.
 */
export default function AvisoError() {
  const { avisoError, limpiarAviso } = useStore();

  // Se va solo a los 6 segundos: suficiente para leerlo sin quedarse pegado.
  useEffect(() => {
    if (!avisoError) return;
    const t = setTimeout(limpiarAviso, 6000);
    return () => clearTimeout(t);
  }, [avisoError, limpiarAviso]);

  if (!avisoError) return null;

  return (
    <div
      className="fixed inset-x-4 bottom-24 z-[95] mx-auto max-w-md"
      role="alert"
      aria-live="assertive"
    >
      <div className="rise flex items-start gap-3 rounded-2xl bg-ink px-4 py-3.5 text-bg shadow-lg">
        <svg
          viewBox="0 0 24 24"
          className="mt-[2px] h-5 w-5 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          aria-hidden
        >
          <path d="M12 8v5" strokeLinecap="round" />
          <path d="M12 16.5h.01" strokeLinecap="round" />
          <circle cx="12" cy="12" r="9" />
        </svg>
        <p className="flex-1 text-sm leading-snug">{avisoError}</p>
        <button
          onClick={limpiarAviso}
          className="-mr-1 -mt-1 shrink-0 p-1 opacity-70"
          aria-label="Cerrar aviso"
          type="button"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            aria-hidden
          >
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
