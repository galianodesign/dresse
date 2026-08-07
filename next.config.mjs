import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next 16 adivina solo cual es la raiz del proyecto, y si encuentra un
  // package-lock.json suelto en una carpeta superior se lia y avisa. Se lo
  // decimos aqui para que no dependa de lo que haya fuera del repositorio.
  turbopack: { root: dirname(fileURLToPath(import.meta.url)) },

  async headers() {
    return [
      {
        // Cabeceras de seguridad para todas las páginas. Faltaban cinco de
        // seis: solo estaba HTTPS forzado.
        source: "/:ruta*",
        headers: [
          // Que nadie pueda meter Dressé dentro de un iframe suyo y engañar
          // a la usuaria para que pulse donde no cree.
          { key: "X-Frame-Options", value: "DENY" },
          // Que el navegador no adivine el tipo de un archivo: si subieran
          // algo disfrazado de imagen, no lo ejecutaría como código.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // No filtrar a terceros la dirección exacta desde la que se navega.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Cámara sí (hace falta para fotografiar prendas); el resto no.
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=(), payment=()",
          },
        ],
      },
      {
        // El modelo de recorte y el motor de ONNX nunca cambian: se sirven
        // con cache de un ano para que el movil los descargue una sola vez.
        // Si algun dia se actualizan, hay que cambiarles el nombre de archivo.
        source: "/:ruta(modelos|ort)/:archivo*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};
export default nextConfig;
