import { NextRequest, NextResponse } from "next/server";

/**
 * Endpoint del asesor Dressé.
 *
 * Dos modos:
 *  - "catalogar": recibe la foto de una prenda y devuelve nombre, categoría,
 *    color y estilo para el armario digital.
 *  - "asesorar": recibe la foto de una prenda que el usuario quiere comprar
 *    más el inventario de su armario, y devuelve un veredicto de compra con
 *    combinaciones concretas.
 *
 * Si no hay ANTHROPIC_API_KEY configurada, responde en modo demo para poder
 * probar toda la interfaz sin coste.
 */

const MODELO = "claude-sonnet-4-6";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { modo, imagen, armario, estilo } = body;

  const apiKey = process.env.ANTHROPIC_API_KEY;

  // ── Modo demo sin API key ──
  if (!apiKey) {
    if (modo === "catalogar") {
      return NextResponse.json({
        nombre: "Prenda sin catalogar (modo demo)",
        categoria: "top",
        color: "—",
        estilo: estilo || "—",
      });
    }
    return NextResponse.json({
      compra: true,
      resumen:
        "Modo demo: configura ANTHROPIC_API_KEY en las variables de entorno para activar el análisis real con IA. Esta es una respuesta de ejemplo.",
      combinaciones: [
        { titulo: "Look diario", prendas: ["Camiseta blanca básica", "Vaqueros rectos", "Zapatillas blancas"] },
        { titulo: "Versión arreglada", prendas: ["Blazer camel", "Pantalón sastre negro", "Botines de piel"] },
      ],
      aviso: "Respuesta simulada. La versión real analiza la foto y tu armario con Claude.",
    });
  }

  // ── Preparar imagen (dataURL → base64 + media type) ──
  const match = /^data:(image\/\w+);base64,(.+)$/.exec(imagen || "");
  if (!match) {
    return NextResponse.json({ error: "Imagen no válida" }, { status: 400 });
  }
  const [, mediaType, data] = match;

  const prompt =
    modo === "catalogar"
      ? `Analiza esta foto de una prenda de ropa. Responde SOLO con JSON válido, sin markdown ni explicaciones, con esta forma exacta:
{"nombre": "nombre corto y natural de la prenda en español", "categoria": "top|pantalon|calzado|abrigo|accesorio", "color": "color principal", "estilo": "Minimalista|Colorida|Elegante|Casual|Streetwear|Romántica"}`
      : `Eres el asesor de estilo de Dressé, una app de armario inteligente. El usuario está pensando en comprar la prenda de la foto. Su estilo personal es "${estilo || "no definido"}". Este es su armario actual:

${JSON.stringify(armario, null, 2)}

Decide si la compra tiene sentido (¿combina con lo que ya tiene? ¿cubre un hueco o duplica algo?) y propón combinaciones concretas usando SOLO prendas que existen en su armario. Sé directo y honesto: si no combina con casi nada, dilo.

Responde SOLO con JSON válido, sin markdown, con esta forma exacta:
{"compra": true/false, "resumen": "2-3 frases en español explicando el veredicto", "combinaciones": [{"titulo": "nombre del look", "prendas": ["prenda 1", "prenda 2"]}], "aviso": "opcional: qué le falta en el armario para sacarle más partido"}`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODELO,
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: mediaType, data },
              },
              { type: "text", text: prompt },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Error de la API de Anthropic:", err);
      return NextResponse.json({ error: "Error del asesor" }, { status: 502 });
    }

    const dataRes = await res.json();
    const texto: string = dataRes.content?.[0]?.text || "";
    const limpio = texto.replace(/```json|```/g, "").trim();
    return NextResponse.json(JSON.parse(limpio));
  } catch (e) {
    console.error("Fallo procesando la respuesta del asesor:", e);
    return NextResponse.json({ error: "Error del asesor" }, { status: 500 });
  }
}
