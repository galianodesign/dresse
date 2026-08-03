"use client";

import { THEMES } from "@/lib/themes";
import { useStore } from "@/lib/store";

export default function ThemePicker({ onUpgrade }: { onUpgrade?: () => void }) {
  const { theme, setTheme, perfil } = useStore();

  return (
    <div className="space-y-3">
      {THEMES.map((t) => {
        const locked = t.premium && !perfil.premium;
        const active = theme === t.id;
        return (
          <button
            key={t.id}
            onClick={() => {
              if (locked) {
                onUpgrade?.();
                return;
              }
              setTheme(t.id);
            }}
            className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
              active ? "border-accent bg-accentSoft" : "border-line bg-surface"
            } ${locked ? "opacity-60" : ""}`}
          >
            <div
              className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border"
              style={{ background: t.tile, borderColor: t.swatches[1] }}
            >
              <span className="text-xl leading-none" style={{ color: t.swatches[2] }}>
                {t.motif}
              </span>
              <span className="mt-1 flex -space-x-1">
                {t.swatches.map((s, i) => (
                  <span key={i} className="h-2.5 w-2.5 rounded-full border border-white/40" style={{ background: s }} />
                ))}
              </span>
            </div>
            <div className="flex-1">
              <p className="font-display text-base">
                <span className="mr-1 text-accent">{t.motif}</span>
                {t.nombre}
              </p>
              <p className="text-xs text-muted font-body">{t.descripcion}</p>
              <p className="mt-0.5 text-[12px] italic text-muted font-body">
                “{t.tagline}”
              </p>
            </div>
            {locked && (
              <span className="rounded-full bg-accent px-2.5 py-1 text-[12px] font-body uppercase tracking-widest text-surface">
                Premium
              </span>
            )}
            {active && !locked && (
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-accent" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        );
      })}

    </div>
  );
}
