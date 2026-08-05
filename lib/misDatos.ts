"use client";

import { createClient } from "@/lib/supabase/client";
import { BUCKET } from "@/lib/almacen";

/**
 * Los dos derechos del RGPD que toda app con datos personales debe ofrecer:
 * llevarte tus datos (portabilidad, art. 20) y que te borren (supresión,
 * art. 17). Hasta agosto de 2026 Dressé no tenía ninguno de los dos.
 */

/** Lista las rutas de todas las fotos subidas por esta usuaria */
async function misFotos(uid: string): Promise<string[]> {
  const supabase = createClient();
  const rutas: string[] = [];
  // El almacén guarda cada foto bajo una carpeta con el id de la usuaria
  const { data, error } = await supabase.storage.from(BUCKET).list(uid, { limit: 1000 });
  if (error || !data) return rutas;
  for (const f of data) if (f.name) rutas.push(`${uid}/${f.name}`);
  return rutas;
}

/**
 * Descarga un archivo con todo lo que Dressé guarda de ti.
 *
 * Se incluyen las direcciones de las fotos firmadas para que se puedan
 * guardar aparte; no se empaquetan las imágenes porque el navegador de un
 * móvil no debería tener que construir un zip de decenas de megas.
 */
export async function descargarMisDatos(uid: string): Promise<void> {
  const supabase = createClient();

  const [perfil, prendas, looks, wishlist, historial, posts, tableros, seguidos, seguidores] =
    await Promise.all([
      supabase.from("perfiles").select("*").eq("id", uid).single(),
      supabase.from("prendas").select("*").eq("usuario_id", uid),
      supabase.from("looks").select("*").eq("usuario_id", uid),
      supabase.from("wishlist").select("*").eq("usuario_id", uid),
      supabase.from("historial_asesor").select("*").eq("usuario_id", uid),
      supabase.from("posts").select("*").eq("usuario_id", uid),
      supabase.from("tableros").select("*").eq("usuario_id", uid),
      supabase.from("seguidores").select("seguido_id").eq("seguidor_id", uid),
      supabase.from("seguidores").select("seguidor_id").eq("seguido_id", uid),
    ]);

  const fotos = await misFotos(uid);
  const { data: firmadas } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(fotos, 3600);

  const todo = {
    generado: new Date().toISOString(),
    aviso:
      "Copia de los datos que Dressé guarda de ti. Las direcciones de las fotos caducan en 1 hora: descárgalas ahora si quieres conservarlas.",
    perfil: perfil.data ?? null,
    prendas: prendas.data ?? [],
    looks: looks.data ?? [],
    wishlist: wishlist.data ?? [],
    historial_del_asesor: historial.data ?? [],
    publicaciones: posts.data ?? [],
    tableros: tableros.data ?? [],
    a_quien_sigues: (seguidos.data ?? []).map((r: any) => r.seguido_id),
    quien_te_sigue: (seguidores.data ?? []).map((r: any) => r.seguidor_id),
    fotos: (firmadas ?? []).map((f: any) => ({ ruta: f.path, descarga: f.signedUrl })),
  };

  const blob = new Blob([JSON.stringify(todo, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `dresse-mis-datos-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Borra la cuenta y todo lo asociado, sin vuelta atrás.
 *
 * Primero las fotos (el almacén no se borra solo) y después los datos y la
 * propia cuenta, mediante una función de la base de datos que recorre las
 * once tablas. No hay claves foráneas contra las cuentas, así que si algún
 * día se añade una tabla nueva hay que añadirla también a esa función.
 */
export async function borrarMiCuenta(uid: string): Promise<void> {
  const supabase = createClient();

  const fotos = await misFotos(uid);
  if (fotos.length) {
    const { error } = await supabase.storage.from(BUCKET).remove(fotos);
    // Si fallan las fotos se aborta: es preferible que la usuaria lo
    // reintente a borrarle la cuenta y dejar sus imágenes en el servidor.
    if (error) throw new Error(`No se pudieron borrar las fotos: ${error.message}`);
  }

  const { error } = await supabase.rpc("borrar_mi_cuenta");
  if (error) throw new Error(`No se pudo borrar la cuenta: ${error.message}`);
}
