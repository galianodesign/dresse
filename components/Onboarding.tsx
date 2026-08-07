"use client";

import { useEffect, useState, type ComponentType } from "react";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import { ESTILOS } from "@/lib/data";
import { t, estiloLabel, ClaveTexto } from "@/lib/i18n";
import { useLockScroll } from "@/lib/useLockScroll";
import {
  IlustracionArmario,
  IlustracionMadame,
  IlustracionComunidad,
} from "@/components/Ilustraciones";

/**
 * Bienvenida de la primera vez.
 *
 * Tres pantallas que explican qué es Dressé y una cuarta que pregunta nombre
 * y estilo personal. El estilo no es decorativo: es lo que Madame Dressé usa
 * para afinar sus consejos, y hasta ahora solo se podía rellenar enterrado en
 * "Editar perfil", así que llegaba vacío a casi todas las cuentas nuevas.
 *
 * Solo aparece si el perfil tiene onboarded = false en la base de datos. Si la
 * columna todavía no existe, el store devuelve true y esta pantalla no se
 * muestra nunca: no rompe nada.
 */

/* Rutas donde nunca debe aparecer, aunque haya sesión */
const RUTAS_EXCLUIDAS = ["/login", "/auth"];

interface Diapositiva {
  titulo: ClaveTexto;
  texto: ClaveTexto;
  // React 19 quitó el espacio de nombres JSX global: hay que tomarlo de React.
  /** Componente de dibujo; acepta un tamaño por className y usa el suyo por defecto */
  ilustracion: ComponentType<{ className?: string }>;
}

const DIAPOSITIVAS: Diapositiva[] = [
  { titulo: "obTitulo1", texto: "obTexto1", ilustracion: IlustracionArmario },
  { titulo: "obTitulo2", texto: "obTexto2", ilustracion: IlustracionMadame },
  { titulo: "obTitulo3", texto: "obTexto3", ilustracion: IlustracionComunidad },
];

const TOTAL = DIAPOSITIVAS.length + 1; // las 3 diapositivas + la de preguntas

export default function Onboarding() {
  const { user, perfil, setPerfil, ready } = useStore();
  const pathname = usePathname();

  const [paso, setPaso] = useState(0);
  const [nombre, setNombre] = useState("");
  const [estilo, setEstilo] = useState("");
  const [prefijado, setPrefijado] = useState(false);

  const excluida = RUTAS_EXCLUIDAS.some((r) => pathname?.startsWith(r));
  const visible = ready && !!user && !perfil.onboarded && !excluida;

  useLockScroll(visible);

  // Prefijar con lo que ya haya en el perfil, una sola vez
  useEffect(() => {
    if (visible && !prefijado) {
      setNombre(perfil.nombre || "");
      setEstilo(perfil.estilo || "");
      setPrefijado(true);
    }
  }, [visible, prefijado, perfil.nombre, perfil.estilo]);

  if (!visible) return null;

  const idioma = perfil.idioma;
  const tx = (clave: ClaveTexto) => t(idioma, clave);

  function terminar(conDatos: boolean) {
    const cambios: { onboarded: boolean; nombre?: string; estilo?: string } = {
      onboarded: true,
    };
    if (conDatos) {
      const limpio = nombre.trim();
      if (limpio) cambios.nombre = limpio;
      if (estilo) cambios.estilo = estilo;
    }
    setPerfil(cambios);
  }

  const esPreguntas = paso === DIAPOSITIVAS.length;
  const dia = esPreguntas ? null : DIAPOSITIVAS[paso];

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-bg">
      <div className="mx-auto flex h-full w-full max-w-md flex-col px-6 pb-10 pt-8">
        {/* Progreso + saltar */}
        <div className="flex items-center gap-4">
          <div className="flex flex-1 gap-1.5" aria-hidden>
            {Array.from({ length: TOTAL }).map((_, i) => (
              <span
                key={i}
                className="h-[2px] flex-1 rounded-full transition-colors duration-300"
                style={{ background: i <= paso ? "var(--ink)" : "var(--line)" }}
              />
            ))}
          </div>
          <button
            onClick={() => terminar(false)}
            className="text-[11px] uppercase tracking-[0.18em] text-muted"
          >
            {tx("obSaltar")}
          </button>
        </div>

        {/* Contenido */}
        {dia ? (
          <div key={paso} className="rise flex flex-1 flex-col justify-center">
            {paso === 0 && (
              <div className="mb-8">
                <p className="text-[11px] uppercase tracking-[0.22em] text-muted">
                  {tx("obBienvenida")}
                </p>
                <p className="mt-1 font-display text-[42px] leading-none">Dressé</p>
                <p className="mt-1.5 text-[11px] uppercase tracking-[0.22em] text-muted">
                  {tx("obTagline")}
                </p>
              </div>
            )}

            <div className="mb-7 opacity-70">
              <dia.ilustracion />
            </div>

            <h2 className="font-display text-[32px] leading-[1.1] tracking-[-0.01em]">
              {tx(dia.titulo)}
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted">
              {tx(dia.texto)}
            </p>
          </div>
        ) : (
          <div key="preguntas" className="rise flex flex-1 flex-col justify-center">
            <h2 className="font-display text-[32px] leading-[1.1] tracking-[-0.01em]">
              {tx("obTitulo4")}
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              {tx("obTexto4")}
            </p>

            <label className="mt-8 block text-[11px] uppercase tracking-[0.18em] text-muted">
              {tx("obNombre")}
            </label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder={tx("obNombrePh")}
              maxLength={40}
              autoComplete="given-name"
              className="mt-2.5 w-full rounded-2xl border border-line bg-surface px-4 py-3.5 text-sm outline-none focus:border-accent"
            />

            <p className="mt-7 text-[11px] uppercase tracking-[0.18em] text-muted">
              {tx("obEstilo")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {ESTILOS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEstilo(estilo === e ? "" : e)}
                  className="chip"
                  data-active={estilo === e}
                >
                  {estiloLabel(idioma, e)}
                </button>
              ))}
            </div>
            <p className="mt-3 text-[12px] leading-relaxed text-muted">
              {tx("obEstiloAyuda")}
            </p>
          </div>
        )}

        {/* Botones */}
        <div className="pt-6">
          <button
            onClick={() => (esPreguntas ? terminar(true) : setPaso(paso + 1))}
            className="btn-primary"
          >
            {esPreguntas ? tx("obEntrar") : tx("obSiguiente")}
          </button>
          {paso > 0 && (
            <button
              onClick={() => setPaso(paso - 1)}
              className="mt-3 w-full py-2 text-[11px] uppercase tracking-[0.18em] text-muted"
            >
              {tx("obAtras")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
