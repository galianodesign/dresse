"use client";

/**
 * Recorte de fondo en el propio móvil.
 *
 * Usa U^2-Net (variante ligera "u2netp", 4,4 MB, licencia Apache 2.0) sobre
 * onnxruntime-web. Todo ocurre en el navegador de la usuaria: la foto no sale
 * de su teléfono y no hay coste por imagen.
 *
 * Se eligió este modelo por descarte: los que dan mejor calidad no se pueden
 * usar en una app de pago (imgly es AGPL, RMBG-1.4 prohíbe el uso comercial)
 * o pesan más de 100 MB, inviable en móvil.
 */

import type { InferenceSession, Tensor } from "onnxruntime-web";

/**
 * onnxruntime se carga como módulo nativo del navegador desde /public, no a
 * través de webpack. Empaquetarlo rompe el build de producción (su bundle usa
 * `import.meta`, que webpack no sabe parsear) y además lo metería en el JS
 * inicial de la app. Así solo se descarga cuando de verdad se recorta algo.
 */
const RUTA_ORT = "/ort/ort.wasm.bundle.min.mjs";

type ModuloOrt = typeof import("onnxruntime-web");

let ortPromesa: Promise<ModuloOrt> | null = null;

function cargarOrt(): Promise<ModuloOrt> {
  if (!ortPromesa) {
    ortPromesa = import(/* webpackIgnore: true */ RUTA_ORT).then((m) => {
      const ort = (m.default ?? m) as ModuloOrt;
      ort.env.wasm.wasmPaths = "/ort/";
      // Un solo hilo: los hilos exigen cabeceras COOP/COEP que romperían
      // otras partes de la app (login de Google, imágenes de Supabase).
      ort.env.wasm.numThreads = 1;
      return ort;
    }).catch((e) => {
      ortPromesa = null;
      throw e;
    });
  }
  return ortPromesa;
}

/** Lado del cuadrado que espera U^2-Net */
const LADO = 320;

/** Normalización estándar de U^2-Net (la misma que usa rembg) */
const MEDIA = [0.485, 0.456, 0.406];
const DESV = [0.229, 0.224, 0.225];

let sesionPromesa: Promise<InferenceSession> | null = null;

/** Carga el modelo una sola vez por sesión de navegador */
async function cargarSesion(): Promise<InferenceSession> {
  if (!sesionPromesa) {
    sesionPromesa = (async () => {
      const ort = await cargarOrt();
      return ort.InferenceSession.create("/modelos/u2netp.onnx", {
        executionProviders: ["wasm"],
      });
    })().catch((e) => {
      sesionPromesa = null; // permitir reintento si falló la descarga
      throw e;
    });
  }
  return sesionPromesa;
}

/** Dibuja la imagen en un canvas cuadrado de 320x320 y devuelve sus píxeles */
function aEntrada(img: HTMLImageElement): Float32Array {
  const canvas = document.createElement("canvas");
  canvas.width = LADO;
  canvas.height = LADO;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, LADO, LADO);
  const { data } = ctx.getImageData(0, 0, LADO, LADO);

  // De RGBA intercalado a tensor NCHW normalizado
  const salida = new Float32Array(3 * LADO * LADO);
  const pixeles = LADO * LADO;
  for (let i = 0; i < pixeles; i++) {
    for (let c = 0; c < 3; c++) {
      salida[c * pixeles + i] = (data[i * 4 + c] / 255 - MEDIA[c]) / DESV[c];
    }
  }
  return salida;
}

/**
 * Convierte la salida del modelo en una máscara 0-255 del tamaño original.
 * U^2-Net devuelve valores sin acotar: hay que reescalarlos entre su mínimo
 * y su máximo antes de usarlos como transparencia.
 */
function aMascara(pred: Float32Array, ancho: number, alto: number): ImageData {
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < pred.length; i++) {
    if (pred[i] < min) min = pred[i];
    if (pred[i] > max) max = pred[i];
  }
  const rango = max - min || 1;

  // Máscara a 320x320 en un canvas, para que el navegador la reescale
  const chico = document.createElement("canvas");
  chico.width = LADO;
  chico.height = LADO;
  const ctxChico = chico.getContext("2d")!;
  const img = ctxChico.createImageData(LADO, LADO);
  for (let i = 0; i < pred.length; i++) {
    const v = Math.round(((pred[i] - min) / rango) * 255);
    img.data[i * 4] = v;
    img.data[i * 4 + 1] = v;
    img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  ctxChico.putImageData(img, 0, 0);

  const grande = document.createElement("canvas");
  grande.width = ancho;
  grande.height = alto;
  const ctxGrande = grande.getContext("2d", { willReadFrequently: true })!;
  ctxGrande.imageSmoothingQuality = "high";
  ctxGrande.drawImage(chico, 0, 0, ancho, alto);
  return ctxGrande.getImageData(0, 0, ancho, alto);
}

export interface ResultadoRecorte {
  /** dataURL JPEG de la prenda sobre el fondo elegido */
  imagen: string;
  /** Milisegundos que tardó solo la inferencia */
  msInferencia: number;
  /**
   * Proporción de la foto que el modelo consideró prenda (0-1). Sirve para
   * detectar recortes absurdos: si sale casi 0 o casi 1, no se ha enterado.
   */
  cobertura: number;
}

/**
 * Recorta el fondo de una foto y devuelve la prenda sobre un color liso.
 * Lanza excepción si el modelo no carga; quien llame debe quedarse con la
 * foto original en ese caso.
 */
export async function recortarFondo(
  dataUrl: string,
  fondo = "#f0ede8"
): Promise<ResultadoRecorte> {
  const sesion = await cargarSesion();
  const ort = await cargarOrt();

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("No se pudo leer la imagen"));
    el.src = dataUrl;
  });

  const entrada = new ort.Tensor("float32", aEntrada(img), [1, 3, LADO, LADO]);
  const t0 = performance.now();
  const salida = await sesion.run({ [sesion.inputNames[0]]: entrada });
  const msInferencia = Math.round(performance.now() - t0);

  // U^2-Net expone varias salidas (d0..d6); la primera es la buena
  const pred = salida[sesion.outputNames[0]] as Tensor;
  const mascara = aMascara(pred.data as Float32Array, img.width, img.height);

  // Componer: fondo liso + prenda recortada
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  const original = ctx.getImageData(0, 0, img.width, img.height);

  const [fr, fg, fb] = hexARgb(fondo);
  let suma = 0;
  for (let i = 0; i < original.data.length; i += 4) {
    const a = mascara.data[i] / 255;
    suma += a;
    original.data[i] = Math.round(original.data[i] * a + fr * (1 - a));
    original.data[i + 1] = Math.round(original.data[i + 1] * a + fg * (1 - a));
    original.data[i + 2] = Math.round(original.data[i + 2] * a + fb * (1 - a));
    original.data[i + 3] = 255;
  }
  ctx.putImageData(original, 0, 0);

  return {
    imagen: canvas.toDataURL("image/jpeg", 0.9),
    msInferencia,
    cobertura: suma / (img.width * img.height),
  };
}

function hexARgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
