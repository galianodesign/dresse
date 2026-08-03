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
  /** dataURL JPEG: la prenda compuesta como foto de catálogo */
  imagen: string;
  /** Milisegundos que tardó solo la inferencia */
  msInferencia: number;
  /**
   * Proporción de la foto que el modelo consideró prenda (0-1). Sirve para
   * detectar recortes absurdos: si sale casi 0 o casi 1, no se ha enterado.
   */
  cobertura: number;
  /** Si se pudo dibujar la sombra (depende del navegador) */
  conSombra: boolean;
}

export interface OpcionesRecorte {
  /** Color de fondo. Por defecto un gris muy claro, tipo catálogo. */
  fondo?: string;
  /** Lado del cuadrado de salida en píxeles */
  lado?: number;
  /** Margen alrededor de la prenda, como fracción del lado (0-0.4) */
  margen?: number;
  /** Dibujar la sombra suave bajo la prenda */
  sombra?: boolean;
}

/** ¿Soporta este navegador el desenfoque de canvas? (Safari solo desde 16.4) */
function soportaDesenfoque(ctx: CanvasRenderingContext2D): boolean {
  try {
    ctx.filter = "blur(2px)";
    const ok = ctx.filter !== "none" && ctx.filter !== "";
    ctx.filter = "none";
    return ok;
  } catch {
    return false;
  }
}

/** Caja mínima que contiene la prenda, según la máscara */
function calcularCaja(mascara: ImageData, w: number, h: number) {
  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;
  let suma = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const a = mascara.data[(y * w + x) * 4];
      suma += a / 255;
      if (a > 128) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { minX, minY, maxX, maxY, cobertura: suma / (w * h) };
}

/**
 * Recorta el fondo y compone la prenda como una foto de catálogo: centrada
 * en un cuadrado, con el mismo margen siempre, sombra suave y fondo neutro.
 *
 * Lo que esto NO hace: quitar arrugas ni dar volumen a la prenda. Eso solo
 * lo consigue una foto bien hecha (o IA generativa, que cuesta dinero).
 *
 * Lanza excepción si el modelo no carga; quien llame debe quedarse con la
 * foto original en ese caso.
 */
export async function recortarFondo(
  dataUrl: string,
  opciones: OpcionesRecorte = {}
): Promise<ResultadoRecorte> {
  const {
    fondo = "#f2f1ef",
    lado = 900,
    margen = 0.09,
    sombra = true,
  } = opciones;

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
  const W = img.width;
  const H = img.height;
  const mascara = aMascara(pred.data as Float32Array, W, H);
  const caja = calcularCaja(mascara, W, H);

  // Sin prenda detectable: devolver la foto tal cual sobre el fondo, para que
  // quien llame lo vea en "cobertura" y decida quedarse con la original.
  if (caja.maxX < 0) {
    return {
      imagen: dataUrl,
      msInferencia,
      cobertura: caja.cobertura,
      conSombra: false,
    };
  }

  // ── Recorte a la caja de la prenda, con transparencia ──
  const cw = caja.maxX - caja.minX + 1;
  const ch = caja.maxY - caja.minY + 1;
  const recorte = document.createElement("canvas");
  recorte.width = cw;
  recorte.height = ch;
  const ctxRecorte = recorte.getContext("2d", { willReadFrequently: true })!;
  ctxRecorte.drawImage(img, -caja.minX, -caja.minY);
  const px = ctxRecorte.getImageData(0, 0, cw, ch);
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const dest = (y * cw + x) * 4;
      const orig = ((y + caja.minY) * W + (x + caja.minX)) * 4;
      px.data[dest + 3] = mascara.data[orig];
    }
  }
  ctxRecorte.putImageData(px, 0, 0);

  // ── Composición final: cuadrado, centrado, mismo margen siempre ──
  const salidaCanvas = document.createElement("canvas");
  salidaCanvas.width = lado;
  salidaCanvas.height = lado;
  const ctx = salidaCanvas.getContext("2d")!;
  ctx.fillStyle = fondo;
  ctx.fillRect(0, 0, lado, lado);

  const disponible = lado * (1 - 2 * margen);
  const escala = Math.min(disponible / cw, disponible / ch);
  const dw = cw * escala;
  const dh = ch * escala;
  const dx = (lado - dw) / 2;
  const dy = (lado - dh) / 2;

  // Sombra: la silueta de la prenda, desenfocada y desplazada hacia abajo.
  // Es lo que más aporta la sensación de "foto de producto".
  let conSombra = false;
  if (sombra && soportaDesenfoque(ctx)) {
    const silueta = document.createElement("canvas");
    silueta.width = cw;
    silueta.height = ch;
    const ctxSil = silueta.getContext("2d")!;
    ctxSil.drawImage(recorte, 0, 0);
    ctxSil.globalCompositeOperation = "source-in";
    ctxSil.fillStyle = "#2a2724";
    ctxSil.fillRect(0, 0, cw, ch);

    ctx.save();
    ctx.filter = `blur(${Math.round(lado * 0.022)}px)`;
    ctx.globalAlpha = 0.26;
    ctx.drawImage(silueta, dx, dy + lado * 0.02, dw, dh);
    ctx.restore();
    conSombra = true;
  }

  ctx.drawImage(recorte, dx, dy, dw, dh);

  return {
    imagen: salidaCanvas.toDataURL("image/jpeg", 0.9),
    msInferencia,
    cobertura: caja.cobertura,
    conSombra,
  };
}
