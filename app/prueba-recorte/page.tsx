"use client";

/**
 * PÁGINA TEMPORAL DE PRUEBA — no forma parte de la app.
 *
 * Sirve para medir si el recorte de fondo en el móvil es viable antes de
 * meterlo en el flujo real del armario. Se borra cuando decidamos.
 *
 * Ruta: /_prueba-recorte
 */

import { useRef, useState } from "react";
import { recortarFondo, type ResultadoRecorte } from "@/lib/recorteFondo";

export default function PruebaRecorte() {
  const [original, setOriginal] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoRecorte | null>(null);
  const [estado, setEstado] = useState("");
  const [msCarga, setMsCarga] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function procesar(dataUrl: string) {
    setError(null);
    setResultado(null);
    setOriginal(dataUrl);
    setEstado("Cargando modelo (solo la primera vez)…");
    const t0 = performance.now();
    try {
      const r = await recortarFondo(dataUrl);
      setMsCarga(Math.round(performance.now() - t0));
      setResultado(r);
      setEstado("Listo");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setEstado("Falló");
    }
  }

  /** Imagen sintética: forma clara sobre fondo con textura, para probar el flujo */
  function generarPrueba() {
    const c = document.createElement("canvas");
    c.width = 480;
    c.height = 480;
    const ctx = c.getContext("2d")!;
    // Fondo tipo "habitación": ruido y manchas
    ctx.fillStyle = "#6b5f52";
    ctx.fillRect(0, 0, 480, 480);
    for (let i = 0; i < 3000; i++) {
      ctx.fillStyle = `rgba(${120 + Math.random() * 60},${100 + Math.random() * 50},${80 + Math.random() * 50},0.5)`;
      ctx.fillRect(Math.random() * 480, Math.random() * 480, 6, 6);
    }
    // "Prenda": camiseta simplificada en color claro
    ctx.fillStyle = "#e8e2d6";
    ctx.beginPath();
    ctx.moveTo(170, 130);
    ctx.lineTo(220, 110);
    ctx.lineTo(260, 110);
    ctx.lineTo(310, 130);
    ctx.lineTo(345, 195);
    ctx.lineTo(305, 215);
    ctx.lineTo(300, 380);
    ctx.lineTo(180, 380);
    ctx.lineTo(175, 215);
    ctx.lineTo(135, 195);
    ctx.closePath();
    ctx.fill();
    procesar(c.toDataURL("image/jpeg", 0.92));
  }

  return (
    <main className="mx-auto max-w-md px-5 py-10">
      <h1 className="font-display text-3xl">Prueba de recorte</h1>
      <p className="mt-2 text-sm text-muted">
        Página temporal. Mide si el recorte de fondo funciona y cuánto tarda.
      </p>

      <div className="mt-6 space-y-2">
        <button onClick={generarPrueba} className="btn-primary">
          Probar con imagen generada
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full rounded-2xl border border-line bg-bg py-3.5 text-sm"
        >
          Probar con una foto mía
        </button>
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
        <p className="mt-5 text-sm" data-testid="estado">
          Estado: <span className="font-medium">{estado}</span>
        </p>
      )}
      {error && (
        <p className="mt-2 text-sm text-red-600" data-testid="error">
          Error: {error}
        </p>
      )}

      {resultado && (
        <div className="mt-4 space-y-1 text-sm" data-testid="metricas">
          <p>
            Total (carga del modelo + recorte):{" "}
            <span className="font-medium">{msCarga} ms</span>
          </p>
          <p>
            Solo el recorte:{" "}
            <span className="font-medium">{resultado.msInferencia} ms</span>
          </p>
          <p>
            Cobertura de la prenda:{" "}
            <span className="font-medium">
              {(resultado.cobertura * 100).toFixed(1)}%
            </span>
          </p>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3">
        {original && (
          <div>
            <p className="mb-1 text-[11px] uppercase tracking-widest text-muted">
              Antes
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={original} alt="original" className="w-full rounded-xl" />
          </div>
        )}
        {resultado && (
          <div>
            <p className="mb-1 text-[11px] uppercase tracking-widest text-muted">
              Después
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resultado.imagen}
              alt="recortada"
              className="w-full rounded-xl"
              data-testid="resultado"
            />
          </div>
        )}
      </div>
    </main>
  );
}
