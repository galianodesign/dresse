import type { Metadata } from "next";
import Link from "next/link";
import {
  IlustracionArmario,
  IlustracionMadame,
  IlustracionComunidad,
} from "@/components/Ilustraciones";
import { EDAD_MINIMA } from "@/lib/edad";

/**
 * Portada pública.
 *
 * Hasta ahora quien llegaba a Dressé sin cuenta caía directamente en el
 * formulario de acceso, sin una sola línea que explicara qué es esto. Nadie se
 * registra en algo que no sabe lo que hace.
 *
 * A quien ya tiene sesión no le llega a aparecer: `proxy.ts` lo manda a su
 * armario antes de servir esta página, así que aquí no hay comprobación de
 * sesión y la página puede ser estática.
 */

export const metadata: Metadata = {
  title: "Dressé — Tu armario, tu estilista y tu comunidad de moda",
  description:
    "Fotografía tu ropa una vez. Dressé la cataloga, te propone conjuntos con lo que ya tienes y te dice si de verdad necesitas eso que estás a punto de comprar.",
  openGraph: {
    title: "Dressé — Tu boutique personal",
    description:
      "Tu armario digital, una estilista que ve tu ropa y una comunidad de moda. Gratis para empezar.",
    type: "website",
    locale: "es_ES",
  },
};

const PILARES = [
  {
    ilustracion: IlustracionArmario,
    titulo: "Tu armario, digitalizado",
    texto:
      "Hazle una foto a cada prenda y olvídate. Se recorta sobre fondo limpio y se cataloga sola: categoría, color y estilo. Por fin ves todo lo que tienes de un vistazo.",
  },
  {
    ilustracion: IlustracionMadame,
    titulo: "Madame Dressé, tu estilista",
    texto:
      "No adivina: mira las fotos de tu ropa. Te propone combinaciones con lo que ya tienes y, antes de que compres nada, te dice si te pega o si ya tienes algo parecido.",
  },
  {
    ilustracion: IlustracionComunidad,
    titulo: "Una comunidad que viste bien",
    texto:
      "Los looks de otras, en tiempo real. Guarda lo que te inspire en tableros. Y si prefieres estar a tu aire, tu cuenta puede ser privada.",
  },
];

export default function Portada() {
  return (
    <main className="mx-auto max-w-md px-6 pb-16 pt-16">
      {/* ── Presentación ── */}
      <header className="text-center">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted">
          Tu boutique personal
        </p>
        <h1 className="mt-3 font-display text-[64px] leading-[0.95] tracking-[-0.02em]">
          Dressé
        </h1>
        <p className="mx-auto mt-7 max-w-[24ch] font-display text-[26px] leading-[1.15]">
          Ya tienes ropa de sobra. Lo que falta es verla.
        </p>
        <p className="mx-auto mt-5 max-w-[32ch] text-[15px] leading-relaxed text-muted">
          Fotografía tu armario una vez. Dressé lo cataloga, te propone
          conjuntos con lo que ya tienes y te dice si de verdad necesitas eso
          que estás a punto de comprar.
        </p>
      </header>

      <div className="mt-9">
        <Link href="/login" className="btn-primary block text-center">
          Crear mi cuenta
        </Link>
        {/* py-4 y no py-2: con el dedo, por debajo de unos 44px de alto se
            falla al pulsar. */}
        <Link
          href="/login"
          className="mt-2 block py-4 text-center text-[11px] uppercase tracking-[0.18em] text-muted transition-colors hover:text-ink"
        >
          Ya tengo cuenta
        </Link>
      </div>

      {/* ── Qué hace ── */}
      <section className="mt-20 space-y-14">
        {PILARES.map(({ ilustracion: Ilustracion, titulo, texto }) => (
          <article key={titulo}>
            <div className="opacity-70">
              <Ilustracion className="h-14 w-14" />
            </div>
            <h2 className="mt-4 font-display text-[24px] leading-tight">
              {titulo}
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">{texto}</p>
          </article>
        ))}
      </section>

      {/* ── Lo que conviene saber antes de registrarse ──
          Va en la portada y no escondido en los textos legales: son
          justamente las dudas que frenan a alguien al crear una cuenta. */}
      <section className="mt-20 rounded-[var(--radius-card)] border border-line bg-[var(--accent-soft)] p-6">
        <h2 className="font-display text-[22px] leading-tight">
          Sin sorpresas
        </h2>
        <ul className="mt-5 space-y-4 text-[14px] leading-relaxed">
          <li>
            <strong>Gratis para empezar.</strong> Hasta 20 prendas, sin pedirte
            ningún dato bancario.
          </li>
          <li>
            <strong>Tus fotos siguen siendo tuyas.</strong> Puedes descargarte
            todo o borrar tu cuenta entera cuando quieras, desde la propia app y
            sin dar explicaciones.
          </li>
          <li>
            <strong>Sin publicidad ni seguimiento.</strong> No vendemos tus
            datos y no usamos herramientas que te sigan por internet.
          </li>
          <li>
            <strong>Con inteligencia artificial, y te lo decimos.</strong> Para
            reconocer tus prendas y dar consejos, tus fotos se envían a analizar.
            Está explicado en la{" "}
            <Link href="/legal/privacidad" className="underline">
              política de privacidad
            </Link>
            .
          </li>
        </ul>
      </section>

      {/* ── Cierre ── */}
      <section className="mt-16 text-center">
        <p className="mx-auto max-w-[26ch] font-display text-[24px] leading-[1.2]">
          Empieza por una prenda. Verás el resto solo.
        </p>
        <Link href="/login" className="btn-primary mt-7 block text-center">
          Crear mi cuenta
        </Link>
      </section>

      <footer className="mt-16 border-t border-line pt-6 text-center text-[12px] leading-relaxed text-muted">
        <div className="flex justify-center gap-4">
          <Link
            href="/legal/privacidad"
            className="inline-block px-2 py-3 underline hover:text-ink"
          >
            Privacidad
          </Link>
          <Link
            href="/legal/terminos"
            className="inline-block px-2 py-3 underline hover:text-ink"
          >
            Términos de uso
          </Link>
        </div>
        <p className="mt-4">A partir de {EDAD_MINIMA} años.</p>
      </footer>
    </main>
  );
}
