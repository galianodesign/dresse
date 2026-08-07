/**
 * Las tres ilustraciones de línea que representan las partes de Dressé.
 *
 * Estaban dentro de Onboarding y ahora las usa también la portada. Viven aquí
 * para que no acaben existiendo dos versiones distintas del mismo dibujo: si
 * se retoca una, se retoca en todas partes.
 *
 * El tamaño se pasa por `className` (por defecto h-20 w-20, el de la
 * bienvenida) porque en la portada van más pequeñas.
 */

export function IlustracionArmario({ className = "h-20 w-20" }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 96" className={className} fill="none" aria-hidden>
      <g stroke="var(--accent)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M48 26a5 5 0 115 5c-3 0-5 2-5 5v3" opacity="0.8" />
        <path d="M48 39 22 57v4h52v-4L48 39z" />
        <path d="M30 61v18h36V61" opacity="0.55" />
        <path d="M48 61v18" opacity="0.35" />
      </g>
    </svg>
  );
}

export function IlustracionMadame({ className = "h-20 w-20" }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 96" className={className} fill="none" aria-hidden>
      <g stroke="var(--accent)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="48" cy="40" rx="20" ry="24" />
        <ellipse cx="48" cy="40" rx="14" ry="18" opacity="0.4" />
        <path d="M48 64v18" />
        <path d="M38 82h20" />
      </g>
      <text
        x="48"
        y="47"
        textAnchor="middle"
        className="font-display"
        fontSize="20"
        fill="var(--accent)"
        opacity="0.75"
      >
        D
      </text>
    </svg>
  );
}

export function IlustracionComunidad({ className = "h-20 w-20" }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 96" className={className} fill="none" aria-hidden>
      <g stroke="var(--accent)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <rect x="18" y="22" width="26" height="34" rx="3" opacity="0.45" />
        <rect x="52" y="30" width="26" height="26" rx="3" opacity="0.45" />
        <rect x="30" y="46" width="34" height="30" rx="3" fill="var(--bg)" />
        <path d="M47 66c-4-3-7-5-7-8a3.4 3.4 0 016-2 3.4 3.4 0 016 2c0 3-3 5-7 8z" opacity="0.8" />
      </g>
    </svg>
  );
}
