"use client";

import { useEffect } from "react";

/** Bloquea el scroll del fondo mientras un modal está abierto */
export function useLockScroll(activo: boolean) {
  useEffect(() => {
    if (!activo) return;
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previo;
    };
  }, [activo]);
}
