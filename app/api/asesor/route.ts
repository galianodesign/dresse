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

/**
 * Tope de fotos que se le enseñan a Madame Dressé de una vez.
 *
 * Cada foto cuesta dinero (alrededor de mil tokens), así que esto acota lo que
 * puede costar una consulta. El plan gratuito permite 20 prendas, de modo que
 * en la práctica casi nadie lo alcanza; existe por las cuentas Premium, que no
 * tienen límite de armario.
 */
const MAX_FOTOS = 24;

/**
 * Madame Dressé: la estilista de la casa. Sofisticada por fuera, amiga por
 * dentro. Habla en español, tutea, es directa y cálida, con criterio real de
 * moda y algún toque de humor. Nunca adula por adular.
 */
const VOZ = `Eres Madame Dressé, la estilista personal de la app Dressé.

Tu personalidad:
- Elegante y con criterio, como una estilista de casa de moda parisina, pero hablas como una amiga que sabe mucho de ropa: cercana, natural, tuteando siempre.
- Directa y honesta. Si algo no le favorece o no le hace falta, se lo dices con cariño pero sin rodeos. Nunca adulas por quedar bien.
- Con chispa: algún toque de humor o una frase con encanto, sin pasarte de graciosa ni de cursi.
- Hablas en español de España, natural y actual. Nada de "outfit espectacular", "¡wow!" ni lenguaje de folleto.
- Nunca usas emojis.
- Frases cortas y con criterio. Explicas el porqué de tus decisiones: proporción, color, ocasión, tejido.`;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { modo, imagen, armario, estilo } = body;

  const apiKey = process.env.ANTHROPIC_API_KEY;

  // ── Modo demo sin API key ──
  if (!apiKey) {
    if (modo === "outfits") {
      return NextResponse.json({
        intro:
          "Modo demo: configura ANTHROPIC_API_KEY en Vercel para que analice tu armario de verdad.",
        outfits: [
          {
            titulo: "Ejemplo de propuesta",
            prendaIds: [],
            prendas: ["Prenda 1", "Prenda 2"],
            porque: "Aquí Madame Dressé te explicaría por qué funciona esta combinación.",
          },
        ],
      });
    }
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

  // ── El generador de outfits no usa imagen: trabaja sobre el armario ──
  if (modo === "outfits") {
    return generarOutfits(apiKey, armario, estilo, body.ocasion);
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
      : `${VOZ}

La persona está pensando en comprarse la prenda de la foto. Su estilo personal es "${estilo || "no definido"}". Este es su armario actual:

${JSON.stringify(armario, null, 2)}

Decide si la compra tiene sentido: ¿combina con lo que ya tiene? ¿cubre un hueco real o duplica algo que ya posee? Propón combinaciones concretas usando SOLO prendas que existan en su armario, llamándolas por su nombre exacto. Si no combina con casi nada, díselo claramente.

Responde SOLO con JSON válido, sin markdown, con esta forma exacta:
{"compra": true/false, "resumen": "2-3 frases con tu voz de Madame Dressé explicando el veredicto", "combinaciones": [{"titulo": "nombre del look", "prendas": ["nombre exacto 1", "nombre exacto 2"]}], "aviso": "opcional: qué le falta en el armario para sacarle más partido"}`;

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


/**
 * Genera outfits combinando ÚNICAMENTE las prendas del armario del usuario,
 * adaptados a la ocasión que indique. Devuelve los ids reales para que la
 * app pueda pintar las prendas y guardar el look.
 */
async function generarOutfits(
  apiKey: string,
  armario: any[],
  estilo: string,
  ocasion: string
) {
  if (!Array.isArray(armario) || armario.length < 2) {
    return NextResponse.json(
      { error: "Necesitas al menos dos prendas en el armario." },
      { status: 400 }
    );
  }

  // Prendas cuya foto puede ver Madame Dressé. Se le pasa la URL pública de
  // Supabase y es la API de Anthropic quien la descarga: así la petición
  // sigue pesando cuatro líneas y no chocamos con el límite de 4,5 MB.
  const conFoto = armario
    .filter((p: any) => typeof p.imagen === "string" && /^https?:\/\//.test(p.imagen))
    .slice(0, MAX_FOTOS);

  const prompt = `${VOZ}

Tu tarea: vestir a esta persona para "${ocasion || "un día cualquiera"}" usando SOLO la ropa que ya tiene. Su estilo personal es "${estilo || "no definido"}".

Su armario (usa los id exactos):
${JSON.stringify(armario.map(({ imagen, ...resto }: any) => resto), null, 2)}
${
  conFoto.length
    ? `
Después de este texto verás las fotos de ${conFoto.length} de esas prendas, cada una precedida por su id. Míralas: fíjate en el color real, el estampado, el tejido y el corte, que dicen mucho más que el nombre. Si lo que ves no coincide con la descripción, fíate de la foto.`
    : ""
}

Reglas:
- Propón entre 2 y 3 outfits completos y distintos entre sí.
- Cada outfit usa entre 2 y 4 prendas del armario, siempre con id reales de la lista. Nunca inventes prendas que no estén.
- Prioriza que cada outfit tenga sentido para la ocasión y que las piezas combinen de verdad (color, proporción, formalidad).
- En "porque" explica en 1-2 frases por qué funciona, con tu criterio de estilista.
- Si el armario da para poco, dilo con honestidad en "intro" en vez de forzar combinaciones malas.

Responde SOLO con JSON válido, sin markdown, con esta forma exacta:
{"intro": "1-2 frases tuyas presentando lo que has preparado", "outfits": [{"titulo": "nombre corto y con encanto del look", "prendaIds": ["id1", "id2"], "porque": "por qué funciona"}]}`;

  const contenidoConFotos: any[] = [{ type: "text", text: prompt }];
  for (const p of conFoto) {
    contenidoConFotos.push({ type: "text", text: `id ${p.id} — ${p.nombre}:` });
    contenidoConFotos.push({
      type: "image",
      source: { type: "url", url: p.imagen },
    });
  }
  if (conFoto.length) {
    contenidoConFotos.push({
      type: "text",
      text: "Ahora responde SOLO con el JSON pedido, sin texto alrededor.",
    });
  }

  const pedir = (contenido: any) =>
    fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODELO,
        max_tokens: 1400,
        messages: [{ role: "user", content: contenido }],
      }),
    });

  try {
    let res = await pedir(contenidoConFotos);

    // Si alguna foto no se puede descargar, la petición entera falla. Antes de
    // dejar a la usuaria sin outfit, se reintenta con el armario solo en texto,
    // que es exactamente como funcionaba hasta ahora.
    if (!res.ok && conFoto.length) {
      console.error("Fallo con fotos, reintentando sin ellas:", await res.text());
      res = await pedir(prompt);
    }

    if (!res.ok) {
      console.error("Error de la API de Anthropic:", await res.text());
      return NextResponse.json({ error: "Error del asesor" }, { status: 502 });
    }

    const dataRes = await res.json();
    const texto: string = dataRes.content?.[0]?.text || "";
    const limpio = texto.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(limpio);

    // Filtrar ids que no existan en el armario, por seguridad
    const idsValidos = new Set(armario.map((p: any) => p.id));
    parsed.outfits = (parsed.outfits || [])
      .map((o: any) => ({
        ...o,
        prendaIds: (o.prendaIds || []).filter((id: string) => idsValidos.has(id)),
      }))
      .filter((o: any) => o.prendaIds.length >= 2);

    return NextResponse.json(parsed);
  } catch (e) {
    console.error("Fallo generando outfits:", e);
    return NextResponse.json({ error: "Error del asesor" }, { status: 500 });
  }
}
