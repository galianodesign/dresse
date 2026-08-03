"use client";

import { useStore } from "@/lib/store";
import { getTheme } from "@/lib/themes";

/**
 * Cabecera editorial: kicker en mayúsculas con tracking amplio, título en
 * serifa display y subtítulo discreto. Sin ornamentos: el aire y la
 * tipografía cargan el peso visual (design system Dressé).
 */
export default function Header({
  titulo,
  subtitulo,
}: {
  titulo: string;
  subtitulo?: string;
}) {
  const { theme } = useStore();
  const t = getTheme(theme);

  return (
    <header className="rise mb-7">
      <p className="text-[11px] uppercase tracking-[0.22em] text-muted">
        Dressé
      </p>
      <h1 className="mt-1.5 font-display text-[34px] leading-[1.08] tracking-[-0.01em]">
        {titulo}
      </h1>
      <p className="mt-2 max-w-[85%] text-sm leading-relaxed text-muted">
        {subtitulo || t.tagline}
      </p>
    </header>
  );
}
