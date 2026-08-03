"use client";

/**
 * PÁGINA TEMPORAL DE PRUEBA — no forma parte de la app.
 *
 * Sirve para decidir si el recorte + composición tipo catálogo merece la pena
 * antes de meterlo en el flujo real del armario. Se borra cuando decidamos.
 *
 * Ruta: /prueba-recorte
 */

import { useRef, useState } from "react";
import { recortarFondo, type ResultadoRecorte } from "@/lib/recorteFondo";

interface Prueba {
  original: string;
  resultado: ResultadoRecorte;
  msTotal: number;
}

export default function PruebaRecorte() {
  const [pruebas, setPruebas] = useState<Prueba[]>([]);
  const [estado, setEstado] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function procesar(dataUrl: string) {
    setError(null);
    setEstado("Procesando… (la primera vez descarga el modelo)");
    const t0 = performance.now();
    try {
      const r = await recortarFondo(dataUrl);
      setPruebas((prev) => [
        {
          original: dataUrl,
          resultado: r,
          msTotal: Math.round(performance.now() - t0),
        },
        ...prev,
      ]);
      setEstado("Listo");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setEstado("Falló");
    }
  }

  return (
    <main className="mx-auto max-w-md px-5 py-10">
      <h1 className="font-display text-3xl">Prueba de recorte</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Página temporal. Prueba con varias fotos seguidas: se van acumulando
        abajo para que veas cómo quedaría el armario entero, no solo una.
      </p>

      {/* Guía de cómo hacer la foto — es lo que más mejora el resultado */}
      <section className="card mt-5 p-4">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted">
          Para que salga bien
        </p>
        <ul className="mt-2 space-y-1 text-sm leading-snug">
          <li>· Extiende la prenda sobre una superficie lisa y de color plano.</li>
          <li>· Luz de ventana, sin flash y sin tu sombra encima.</li>
          <li>· La prenda entera dentro del encuadre, vista desde arriba.</li>
        </ul>
        <p className="mt-2 text-[12px] leading-snug text-muted">
          Ninguna IA puede inventar lo que no está en la foto: una prenda
          arrugada seguirá arrugada.
        </p>
      </section>

      <div className="mt-5 space-y-2">
        <button onClick={() => fileRef.current?.click()} className="btn-primary">
          Probar con una foto mía
        </button>
        {pruebas.length > 0 && (
          <button
            onClick={() => setPruebas([])}
            className="w-full rounded-2xl border border-line bg-bg py-3 text-sm text-muted"
          >
            Vaciar
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const reader = new FileReader();
            reader.onload = () => procesar(reader.result as string);
            reader.readAsDataURL(f);
            e.target.value = "";
          }}
        />
      </div>

      {estado && (
        <p className="mt-4 text-sm" data-testid="estado">
          Estado: <span className="font-medium">{estado}</span>
        </p>
      )}
      {error && (
        <p className="mt-2 text-sm text-red-600" data-testid="error">
          Error: {error}
        </p>
      )}

      {/* Cómo se vería el armario de verdad */}
      {pruebas.length > 0 && (
        <>
          <h2 className="mt-8 font-display text-2xl">Así quedaría tu armario</h2>
          <div className="mt-3 grid grid-cols-2 gap-3" data-testid="rejilla">
            {pruebas.map((p, i) => (
              <div key={i} className="hang-tag overflow-hidden pt-5">
                <div className="mx-3 aspect-square overflow-hidden rounded-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.resultado.imagen}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="px-3 py-2.5">
                  <p className="truncate font-display text-base leading-tight">
                    Prenda {pruebas.length - i}
                  </p>
                  <p className="mt-0.5 text-[12px] uppercase tracking-widest text-muted">
                    Negro · Casual
                  </p>
                </div>
              </div>
            ))}
          </div>

          <h2 className="mt-8 font-display text-2xl">Antes y después</h2>
          <div className="mt-3 space-y-5">
            {pruebas.map((p, i) => (
              <div key={i}>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="mb-1 text-[11px] uppercase tracking-widest text-muted">
                      Tu foto
                    </p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.original} alt="" className="w-full rounded-xl" />
                  </div>
                  <div>
                    <p className="mb-1 text-[11px] uppercase tracking-widest text-muted">
                      Procesada
                    </p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.resultado.imagen}
                      alt=""
                      className="w-full rounded-xl"
                      data-testid="resultado"
                    />
                  </div>
                </div>
                <p className="mt-1 text-[12px] leading-snug text-muted">
                  {p.msTotal} ms en total · {p.resultado.msInferencia} ms de
                  recorte · la prenda ocupa{" "}
                  {(p.resultado.cobertura * 100).toFixed(0)}% de tu foto
                  {p.resultado.conSombra ? " · con sombra" : " · SIN sombra"}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
