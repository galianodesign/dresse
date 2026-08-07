import Link from "next/link";
import { ACTUALIZADO } from "@/lib/legal";

/**
 * Envoltorio de las páginas legales.
 *
 * Son páginas públicas a propósito: la ley exige que se puedan leer antes de
 * registrarse, así que no pasan por el control de sesión.
 *
 * El texto va en un ancho de lectura cómodo y algo más grande de lo normal.
 * Un texto legal que nadie puede leer no cumple nada: el RGPD pide que la
 * información sea "concisa, transparente, inteligible y de fácil acceso".
 */
export default function PaginaLegal({
  titulo,
  entradilla,
  children,
}: {
  titulo: string;
  entradilla: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto min-h-dvh max-w-2xl px-5 pb-24 pt-8">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          aria-hidden
        >
          <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Volver a Dressé
      </Link>

      <h1 className="font-display text-4xl leading-tight">{titulo}</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-muted">{entradilla}</p>
      <p className="mt-6 text-xs text-muted">Última actualización: {ACTUALIZADO}</p>

      <div className="mt-10 space-y-10">{children}</div>

      <footer className="mt-16 border-t border-line pt-6 text-sm text-muted">
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/legal/privacidad" className="underline hover:text-ink">
            Política de privacidad
          </Link>
          <Link href="/legal/terminos" className="underline hover:text-ink">
            Términos de uso
          </Link>
        </div>
      </footer>
    </main>
  );
}

/** Un apartado numerado del documento. */
export function Apartado({
  n,
  titulo,
  children,
}: {
  n: number;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-2xl leading-tight">
        <span className="mr-2 text-muted">{n}.</span>
        {titulo}
      </h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed">{children}</div>
    </section>
  );
}

/**
 * Recuadro para lo que no debería pasarse por alto: qué se envía fuera, qué
 * no podemos garantizar, cómo borrar la cuenta.
 */
export function Destacado({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-[var(--accent-soft)] p-4 text-[15px] leading-relaxed">
      {children}
    </div>
  );
}

/** Lista con viñetas, con el espaciado del resto del documento. */
export function Lista({ children }: { children: React.ReactNode }) {
  return (
    <ul className="list-disc space-y-2 pl-5 marker:text-muted">{children}</ul>
  );
}
