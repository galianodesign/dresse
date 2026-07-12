"use client";

import { useStore } from "@/lib/store";
import { getTheme } from "@/lib/themes";
import { Flourish } from "@/components/ThemeDecor";

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
    <header className="relative mb-6 rise">
      <div className="absolute -top-2 right-0">
        <Flourish size={62} />
      </div>
      <p className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-muted">
        <span className="text-accent">{t.motif}</span> Dressé
      </p>
      <h1 className="mt-1 max-w-[75%] font-display text-4xl">{titulo}</h1>
      <p className="mt-1 max-w-[80%] text-sm leading-relaxed text-muted">
        {subtitulo || t.tagline}
      </p>
    </header>
  );
}
