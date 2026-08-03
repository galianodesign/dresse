/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
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
