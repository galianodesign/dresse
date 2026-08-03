"use client";

/**
 * Botón de cerrar de los paneles.
 *
 * Existe para que todos los paneles se cierren igual. Antes cada uno lo hacía
 * a su manera —o no lo tenía— y había que adivinar que se cerraban tocando
 * fuera, cosa que en un móvil no se le ocurre a nadie.
 */
export default function BotonCerrar({
  onClick,
  className = "",
  etiqueta = "Cerrar",
}: {
  onClick: () => void;
  /** Posicionamiento extra (por ejemplo "absolute right-4 top-4") */
  className?: string;
  etiqueta?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`btn-cerrar ${className}`}
      aria-label={etiqueta}
      type="button"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        aria-hidden
      >
        <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
      </svg>
    </button>
  );
}

/**
 * Cabecera de panel: título a la izquierda, botón de cerrar a la derecha.
 * Es la forma recomendada de encabezar un panel, para que el botón caiga
 * siempre en el mismo sitio y el título nunca se le meta debajo.
 */
export function CabeceraPanel({
  titulo,
  onCerrar,
  children,
}: {
  titulo: string;
  onCerrar: () => void;
  /** Subtítulo o cualquier cosa que vaya bajo el título */
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="font-display text-2xl leading-tight">{titulo}</h2>
        {children}
      </div>
      <BotonCerrar onClick={onCerrar} className="shrink-0" />
    </div>
  );
}
