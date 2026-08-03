# Licencias de terceros

Componentes de terceros incluidos directamente en este repositorio (dentro de
`public/`). Se listan aquí porque sus licencias exigen conservar la atribución.

---

## U^2-Net — modelo de recorte de fondo

- **Archivo:** `public/modelos/u2netp.onnx`
- **Qué es:** variante ligera ("u2netp", ~1,1 M parámetros) del modelo de
  segmentación de objetos salientes U^2-Net. Se usa para separar la prenda del
  fondo en el navegador de la usuaria.
- **Autores:** Xuebin Qin y col., University of Alberta.
- **Publicación:** *U^2-Net: Going Deeper with Nested U-Structure for Salient
  Object Detection*, Pattern Recognition, 2020.
- **Origen del archivo:** distribución ONNX publicada por el proyecto
  [rembg](https://github.com/danielgatis/rembg).
- **Licencia:** Apache License 2.0.
- **Cambios:** ninguno. El archivo se incluye tal cual, sin reentrenar ni
  modificar los pesos.

## ONNX Runtime Web

- **Archivos:** `public/ort/ort.wasm.bundle.min.mjs`,
  `public/ort/ort-wasm-simd-threaded.mjs`,
  `public/ort/ort-wasm-simd-threaded.wasm`
- **Qué es:** motor que ejecuta el modelo anterior dentro del navegador.
- **Autor:** Microsoft.
- **Licencia:** MIT.
- **Cambios:** ninguno. Copiados sin modificar desde el paquete npm
  `onnxruntime-web` v1.27.0.

---

## Nota sobre alternativas descartadas

Se evaluaron modelos de recorte con mejor calidad y se descartaron por
licencia, no por rendimiento. Queda constancia para no repetir el análisis:

| Modelo / librería | Motivo del descarte |
|---|---|
| `@imgly/background-removal` | Licencia AGPL: obligaría a publicar toda la app bajo AGPL. |
| `briaai/RMBG-1.4` | Licencia Creative Commons **no comercial**. Dressé es de pago. |
| `schirrmacher/ormbg` | Apache 2.0, pero entrenado para personas, no para objetos. |
| `BiRefNet_lite` | Licencia MIT y buena calidad, pero pesa 109-214 MB: inviable en móvil. |
