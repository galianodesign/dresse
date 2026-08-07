import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";

/**
 * Identifica a quien llama a una ruta de la API leyendo su sesión de las
 * cookies.
 *
 * Hace falta porque /api/asesor estaba ABIERTA A INTERNET: cualquiera con la
 * dirección podía llamarla sin cuenta y gastar el saldo de Anthropic, o usarla
 * como si fuera su propia clave de IA. Comprobado el 7 de agosto de 2026 con
 * una petición anónima contra producción: respondió 200 y analizó la imagen.
 *
 * Devuelve el id de la usuaria, o null si no hay sesión válida. `getUser()`
 * pregunta al servidor de Supabase, así que una cookie manipulada o de una
 * cuenta ya borrada no cuela.
 */
function clienteDeLaPeticion(req: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Sin esto, rpc() y from() buscan en el esquema "public" (el del CRM,
      // que no tiene nada de Dressé) y fallan en silencio.
      db: { schema: "dresse" },
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        // La ruta no devuelve cookies nuevas: solo lee para saber quién llama.
        setAll() {},
      },
    }
  );
}

export async function usuarioDeLaPeticion(req: NextRequest): Promise<string | null> {
  try {
    const {
      data: { user },
    } = await clienteDeLaPeticion(req).auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Suma una consulta al cupo diario y dice si sigue dentro.
 *
 * Segunda barrera después de exigir sesión: que una cuenta legítima tampoco
 * pueda vaciar el saldo de Anthropic. El tope está muy por encima de un uso
 * normal, así que solo lo nota quien esté abusando.
 *
 * Si la comprobación falla por un problema de la base de datos se deja pasar:
 * dejar sin asesor a todo el mundo porque una consulta de contabilidad falló
 * sería peor que el riesgo que evita.
 */
export async function consumirCupo(req: NextRequest): Promise<boolean> {
  try {
    const { data, error } = await clienteDeLaPeticion(req).rpc("consumir_cupo_asesor");
    if (error) {
      console.error("[Dressé] no se pudo comprobar el cupo:", error.message);
      return true;
    }
    return data !== false;
  } catch (e) {
    console.error("[Dressé] no se pudo comprobar el cupo:", e);
    return true;
  }
}
