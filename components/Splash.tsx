"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { getTheme } from "@/lib/themes";

/** Pantalla de arranque: solo la primera carga de cada sesión */
export default function Splash() {
  const { theme } = useStore();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem("dresse.splash")) {
      sessionStorage.setItem("dresse.splash", "1");
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 1600);
      return () => clearTimeout(t);
    }
  }, []);

  if (!visible) return null;
  const t = getTheme(theme);

  return (
    <div className="splash" aria-hidden>
      <span className="text-3xl text-accent">{t.motif}</span>
      <p className="font-display text-5xl">Dressé</p>
      <p className="text-[12px] uppercase tracking-[0.35em] text-muted">
        Tu boutique personal
      </p>
    </div>
  );
}
