"use client";

/**
 * Reducir una foto antes de mandarla a la API.
 *
 * Motivo: las funciones de Vercel rechazan cualquier peticion de mas de
 * 4,5 MB con un 413. Una foto de iPhone a resolucion completa (3024x4032)
 * pesa casi 5 MB en base64, asi que el catalogado fallaba en silencio y la
 * prenda se guardaba sin nombre ni color. Comprobado en produccion: 4,96 MB
 * devuelve 413 FUNCTION_PAYLOAD_TOO_LARGE tras 12 segundos de espera.
 *
 * 1024 px de lado es de sobra para que la IA reconozca prenda, color y
 * estampado, y deja la peticion en un par de cientos de kilobytes.
 */
export function comprimirADataUrl(
  dataUrl: string,
  maxLado = 1024,
  calidad = 0.85
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxLado || height > maxLado) {
        const f = Math.min(maxLado / width, maxLado / height);
        width = Math.round(width * f);
        height = Math.round(height * f);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(dataUrl);
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", calidad));
    };
    // Si la imagen no se puede leer, devolver la original: peor es no
    // intentar la llamada siquiera.
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
