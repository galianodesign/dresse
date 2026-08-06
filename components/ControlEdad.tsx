"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useStore } from "@/lib/store";
import { EDAD_MINIMA, calcularEdad, revisarNacimiento, fechaMaxima } from "@/lib/edad";
import { useLockScroll } from "@/lib/useLockScroll";

/**
 * Control de edad.
 *
 * Los términos de uso dicen que hay que tener 14 años. Escribir esa regla y no
 * aplicarla es peor que no tenerla, porque queda por escrito que se conocía.
 *
 * Aparece cuando el perfil no tiene fecha de nacimiento, así que cubre tres
 * casos con una sola pantalla: quien entra con Google (a quien no se le puede
 * preguntar antes, porque se va a Google y vuelve ya identificada), quien se
 * registró antes de que esto existiera, y quien se salte de algún modo el
 * formulario de registro.
 *
 * No se puede cerrar ni saltar: sin fecha no se entra.
 */

/* Rutas donde nunca debe aparecer: el acceso y los propios textos legales,
   que tienen que poder leerse siempre. */
const RUTAS_EXCLUIDAS = ["/login", "/auth", "/legal"];

export default function ControlEdad() {
  const { user, perfil, setPerfil, ready } = useStore();
  const pathname = usePathname();
  const supabase = createClient();

  const [fecha, setFecha] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const excluida = RUTAS_EXCLUIDAS.some((r) => pathname?.startsWith(r));
  const visible = ready && !!user && perfil.nacimiento === null && !excluida;

  useLockScroll(visible);

  /**
   * Quien se registró con correo ya escribió la fecha en el formulario, y ésta
   * viaja con la cuenta. Se recoge sin preguntar de nuevo: repetir la misma
   * pregunta dos veces seguidas parece un fallo de la aplicación.
   *
   * Se vuelve a revisar aquí en lugar de darla por buena: el dato viene del
   * navegador y podría haberse manipulado al registrarse.
   */
  const declarada = (user?.user_metadata as Record<string, unknown> | undefined)
    ?.nacimiento;

  useEffect(() => {
    if (!visible) return;
    if (typeof declarada === "string" && !revisarNacimiento(declarada)) {
      setPerfil({ nacimiento: declarada });
    }
  }, [visible, declarada]);

  if (!visible) return null;

  const edad = calcularEdad(fecha);
  const demasiadoJoven = edad !== null && edad < EDAD_MINIMA;

  function confirmar() {
    const problema = revisarNacimiento(fecha);
    if (problema) {
      setError(problema);
      return;
    }
    setGuardando(true);
    setError(null);
    setPerfil({ nacimiento: fecha });
  }

  async function salir() {
    await supabase.auth.signOut();
    location.href = "/login";
  }

  return (
    <div className="fixed inset-0 z-[95] flex flex-col bg-bg">
      <div className="mx-auto flex h-full w-full max-w-md flex-col justify-center px-6 pb-10 pt-8">
        <div className="rise">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted">
            Antes de empezar
          </p>
          <h2 className="mt-2 font-display text-[32px] leading-[1.1] tracking-[-0.01em]">
            ¿Cuándo naciste?
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-muted">
            Necesitamos saber tu edad para poder ofrecerte Dressé. Es la única
            vez que te lo preguntamos y no se muestra a nadie.
          </p>

          <label
            htmlFor="nacimiento"
            className="mt-8 block text-[11px] uppercase tracking-[0.18em] text-muted"
          >
            Fecha de nacimiento
          </label>
          <input
            id="nacimiento"
            type="date"
            value={fecha}
            max={fechaMaxima()}
            onChange={(e) => {
              setFecha(e.target.value);
              setError(null);
            }}
            className="mt-2.5 w-full rounded-2xl border border-line bg-surface px-4 py-3.5 text-sm outline-none focus:border-accent"
          />

          {/* Devolver la edad calculada evita el disgusto de quien se equivoca
              de año y no entiende por qué se le rechaza. */}
          {edad !== null && !error && (
            <p className="mt-2.5 text-[13px] text-muted">
              Según esa fecha tienes {edad} {edad === 1 ? "año" : "años"}.
            </p>
          )}

          {error && (
            <p className="mt-2.5 text-[13px] leading-relaxed text-red-600">{error}</p>
          )}

          <button
            onClick={confirmar}
            disabled={!fecha || demasiadoJoven || guardando}
            className="btn-primary mt-7 disabled:opacity-40"
          >
            {guardando ? "Un momento…" : "Continuar"}
          </button>

          {demasiadoJoven && (
            <div className="mt-5 rounded-[var(--radius-card)] border border-line bg-[var(--accent-soft)] p-4">
              <p className="text-[14px] leading-relaxed">
                Para usar Dressé hay que tener al menos {EDAD_MINIMA} años. Si
                te has equivocado de fecha, corrígela arriba.
              </p>
              <button
                onClick={salir}
                className="mt-3 text-[13px] underline text-muted hover:text-ink"
              >
                Cerrar sesión
              </button>
            </div>
          )}

          <p className="mt-8 text-[12px] leading-relaxed text-muted">
            Guardamos tu fecha de nacimiento únicamente para comprobar este
            requisito.{" "}
            <a href="/legal/privacidad" className="underline hover:text-ink">
              Política de privacidad
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
