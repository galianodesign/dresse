"use client";

/** Aviso flotante de confirmación con check animado */
export default function Toast({ mensaje }: { mensaje: string }) {
  return (
    <div className="toast" role="status">
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4">
        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {mensaje}
    </div>
  );
}
