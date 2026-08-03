"use client";

import { useStore } from "@/lib/store";
import { ThemeId } from "@/lib/themes";

/**
 * Decoraciones visuales exclusivas de cada tema.
 *
 * <Flourish/>       — ornamento SVG de cabeceras y tarjetas.
 * <ThemeAmbience/>  — partículas animadas de ambiente (solo temas premium).
 * <SectionBackdrop/> — ornamento gigante translúcido de fondo, distinto
 *                      en cada sección (solo temas premium).
 */

export function Flourish({ size = 64 }: { size?: number }) {
  const { theme } = useStore();
  const s = { width: size, height: size };

  switch (theme) {
    case "signature":
      return (
        <svg viewBox="0 0 64 64" style={s} fill="none" aria-hidden>
          <g opacity="0.5">
            <path d="M14 10 Q30 2 42 14" stroke="var(--accent)" strokeWidth="1.2" strokeDasharray="3 3" />
            <rect x="34" y="12" width="20" height="30" rx="3" transform="rotate(14 44 27)" stroke="var(--accent)" strokeWidth="1.4" fill="var(--surface)" />
            <circle cx="43" cy="20" r="2" stroke="var(--accent)" strokeWidth="1.2" />
            <path d="M39 30 h11 M40 35 h8" stroke="var(--accent)" strokeWidth="1.2" strokeLinecap="round" />
          </g>
        </svg>
      );

    case "paris":
      return (
        <svg viewBox="0 0 64 64" style={s} fill="none" aria-hidden>
          <g opacity="0.55">
            {[0, 72, 144, 216, 288].map((r) => (
              <ellipse key={r} cx="44" cy="14" rx="6" ry="9" transform={`rotate(${r} 44 22)`} fill="var(--accent)" opacity="0.35" />
            ))}
            <circle cx="44" cy="22" r="3.5" fill="var(--accent)" />
            <path d="M40 34 Q30 46 18 50" stroke="var(--accent)" strokeWidth="1.3" strokeLinecap="round" />
            <path d="M30 42 q4 -6 10 -5 M30 42 q-6 4 -5 10" stroke="var(--accent)" strokeWidth="1.1" strokeLinecap="round" />
          </g>
        </svg>
      );

    case "milano":
      return (
        <svg viewBox="0 0 64 64" style={s} fill="none" aria-hidden>
          <g opacity="0.6" stroke="var(--accent)" strokeWidth="1.4">
            <path d="M24 8 H56 V40" />
            <path d="M34 16 H48 V30" opacity="0.7" />
            <path d="M42 24 H42.01" strokeWidth="3" strokeLinecap="square" />
          </g>
        </svg>
      );

    case "riviera":
      return (
        <svg viewBox="0 0 64 64" style={s} fill="none" aria-hidden>
          <g opacity="0.6" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="46" cy="16" r="6" opacity="0.7" />
            <path d="M8 40 q6 -6 12 0 t12 0 t12 0 t12 0" />
            <path d="M14 50 q6 -6 12 0 t12 0 t12 0" opacity="0.6" />
          </g>
        </svg>
      );

    case "tokio":
      return (
        <svg viewBox="0 0 64 64" style={s} fill="none" aria-hidden>
          <g opacity="0.65">
            {[0, 72, 144, 216, 288].map((r) => (
              <path key={r} d="M44 22 q-4 -8 0 -13 q4 5 0 13" transform={`rotate(${r} 44 22)`} fill="var(--accent)" opacity="0.45" />
            ))}
            <circle cx="44" cy="22" r="2.5" fill="var(--accent)" />
            <path d="M20 40 q-3 -5 0 -9 q3 4 0 9" fill="var(--accent)" opacity="0.35" transform="rotate(30 20 36)" />
            <path d="M14 54 q-3 -5 0 -9 q3 4 0 9" fill="var(--accent)" opacity="0.25" transform="rotate(-20 14 50)" />
          </g>
        </svg>
      );

    case "londres":
      return (
        <svg viewBox="0 0 64 64" style={s} fill="none" aria-hidden>
          <g opacity="0.6">
            <path d="M12 54 Q30 40 50 14" stroke="var(--accent)" strokeWidth="1.4" strokeLinecap="round" fill="none" />
            {[
              { x: 42, y: 20, r: 30 },
              { x: 32, y: 32, r: -40 },
              { x: 22, y: 44, r: 25 },
            ].map((h, i) => (
              <path key={i} d={`M${h.x} ${h.y} q8 -2 8 -10 q-8 2 -8 10`} fill="var(--accent)" opacity={0.4 - i * 0.08} transform={`rotate(${h.r} ${h.x} ${h.y})`} />
            ))}
          </g>
        </svg>
      );

    default:
      return null;
  }
}

/* ─── Partículas de ambiente por tema (solo premium) ─── */

const SLOTS = [
  { left: "8%", delay: "0s", dur: "11s", size: 10 },
  { left: "24%", delay: "3s", dur: "14s", size: 8 },
  { left: "42%", delay: "6s", dur: "12s", size: 11 },
  { left: "61%", delay: "1.5s", dur: "15s", size: 9 },
  { left: "78%", delay: "4.5s", dur: "13s", size: 10 },
  { left: "91%", delay: "8s", dur: "16s", size: 7 },
];

function Particula({ theme }: { theme: ThemeId }) {
  switch (theme) {
    case "tokio": // pétalo de sakura
      return <path d="M6 1 q-3 4 0 9 q3 -5 0 -9" fill="var(--accent)" opacity="0.5" />;
    case "paris": // florecita de 5 puntos
      return (
        <g opacity="0.45" fill="var(--accent)">
          {[0, 72, 144, 216, 288].map((r) => (
            <ellipse key={r} cx="6" cy="3" rx="1.6" ry="2.6" transform={`rotate(${r} 6 6)`} />
          ))}
        </g>
      );
    case "milano": // rombo afilado
      return <path d="M6 0 L11 6 L6 12 L1 6 Z" fill="none" stroke="var(--accent)" strokeWidth="0.8" opacity="0.4" />;
    case "londres": // hoja de hiedra
      return <path d="M6 1 q5 2 4 8 q-6 1 -8 -4 q2 -3 4 -4" fill="var(--accent)" opacity="0.35" />;
    default:
      return null;
  }
}

export function ThemeAmbience() {
  const { theme } = useStore();

  // Riviera: burbujas de mar que suben desde abajo
  if (theme === "riviera") {
    return (
      <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden" aria-hidden>
        {SLOTS.map((p, i) => (
          <svg
            key={i}
            viewBox="0 0 12 12"
            className="bubble absolute"
            style={{ left: p.left, width: p.size, height: p.size, animationDelay: p.delay, animationDuration: p.dur }}
          >
            <circle cx="6" cy="6" r="4.5" fill="none" stroke="var(--accent)" strokeWidth="1" opacity="0.4" />
          </svg>
        ))}
      </div>
    );
  }

  // Temas con partículas que caen
  if (["tokio", "paris", "milano", "londres"].includes(theme)) {
    return (
      <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden" aria-hidden>
        {SLOTS.map((p, i) => (
          <svg
            key={i}
            viewBox="0 0 12 12"
            className="petal absolute"
            style={{ left: p.left, width: p.size, height: p.size, animationDelay: p.delay, animationDuration: p.dur }}
          >
            <Particula theme={theme} />
          </svg>
        ))}
      </div>
    );
  }

  // Signature (gratuito): sin ambiente
  return null;
}

/* ─── Ornamento gigante de fondo, distinto por sección (solo premium) ─── */

type Seccion = "armario" | "asesor" | "comunidad" | "perfil";

const POSICIONES: Record<Seccion, string> = {
  armario: "right-[-70px] top-[90px] rotate-12",
  asesor: "left-[-80px] top-[200px] -rotate-12",
  comunidad: "right-[-60px] bottom-[140px] rotate-6",
  perfil: "left-[-70px] bottom-[200px] -rotate-6",
};

export function SectionBackdrop({ seccion }: { seccion: Seccion }) {
  const { theme, perfil } = useStore();
  if (theme === "signature" || !perfil.premium) return null;

  return (
    <div
      className={`pointer-events-none fixed z-0 opacity-[0.16] ${POSICIONES[seccion]}`}
      aria-hidden
    >
      <Flourish size={260} />
    </div>
  );
}
