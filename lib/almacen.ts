"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

/** Vale para el cliente de cualquier esquema, no solo el "public" por defecto */
type ClienteSupabase = SupabaseClient<any, any, any, any, any>;

/**
 * Acceso a las fotos guardadas en Supabase Storage.
 *
 * Hasta agosto de 2026 el almacén era público: cualquiera con la dirección
 * descargaba cualquier foto sin sesión, también las de cuentas privadas.
 * Ahora las direcciones se firman y caducan, así que una dirección filtrada
 * deja de servir al cabo de unas horas en vez de para siempre.
 *
 * En la base de datos se guarda la RUTA del archivo, no una dirección. Las
 * filas antiguas guardan la dirección pública entera; `rutaDe` entiende las
 * dos formas, así que no hace falta migrar nada.
 */

export const BUCKET = "dresse";

/** Cuánto vive una dirección firmada. Suficiente para una sesión larga. */
export const HORAS_VALIDEZ = 8;
const SEGUNDOS_VALIDEZ = HORAS_VALIDEZ * 3600;

/**
 * Saca la ruta del archivo de lo que haya guardado en la base de datos, que
 * puede ser una ruta ya (filas nuevas) o una dirección pública entera
 * (filas anteriores al cambio).
 */
export function rutaDe(valor: string | null | undefined): string | null {
  if (!valor) return null;
  // Las direcciones firmadas nunca se guardan: si llega una, no es una ruta.
  const marca = `/object/public/${BUCKET}/`;
  const i = valor.indexOf(marca);
  if (i !== -1) return decodeURIComponent(valor.slice(i + marca.length).split("?")[0]);
  if (/^https?:\/\//.test(valor)) return null; // dirección ajena: no es nuestra
  return valor.replace(/^\/+/, "");
}

/**
 * Firma varias rutas de una vez y devuelve un diccionario ruta → dirección.
 * Se hace en lote porque una pantalla puede tener veinte fotos y no vamos a
 * pedir veinte firmas por separado.
 */
export async function firmarRutas(
  supabase: ClienteSupabase,
  valores: (string | null | undefined)[]
): Promise<Map<string, string>> {
  const rutas = Array.from(
    new Set(valores.map(rutaDe).filter((r): r is string => !!r))
  );
  const mapa = new Map<string, string>();
  if (!rutas.length) return mapa;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(rutas, SEGUNDOS_VALIDEZ);

  if (error || !data) {
    console.error("[Dressé] no se pudieron firmar las fotos:", error?.message);
    return mapa;
  }
  for (const f of data) {
    // Supabase devuelve un error por archivo si alguno no existe
    if (f.signedUrl && f.path) mapa.set(f.path, f.signedUrl);
  }
  return mapa;
}

/** Atajo para una sola foto. Devuelve null si no se pudo firmar. */
export async function firmarUna(
  supabase: ClienteSupabase,
  valor: string | null | undefined
): Promise<string | null> {
  const ruta = rutaDe(valor);
  if (!ruta) return null;
  const mapa = await firmarRutas(supabase, [valor]);
  return mapa.get(ruta) ?? null;
}

/**
 * Sustituye el valor guardado por su dirección firmada, usando el diccionario
 * que devuelve `firmarRutas`. Si no se pudo firmar, devuelve null en vez de
 * una dirección rota: quien pinte la imagen ya tiene su marcador de "sin foto".
 */
export function resolver(
  mapa: Map<string, string>,
  valor: string | null | undefined
): string | null {
  const ruta = rutaDe(valor);
  return ruta ? mapa.get(ruta) ?? null : null;
}
