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

export interface Cupo {
  ok: boolean;
  usadas?: number;
  tope?: number;
  restantes?: number;
  premium?: boolean;
}

/**
 * Suma un uso de IA y devuelve cómo ha quedado el cupo.
 *
 * Hay dos cupos distintos, y la diferencia es una decisión de negocio:
 *
 *  - "catalogar": libre. Fotografiar la ropa es el trabajo que hace la
 *    clienta y lo que la ata a la app; cobrarle por terminarlo sería al
 *    revés. Solo lleva un tope diario alto contra abusos.
 *  - "asesorar": 5 al mes en el plan gratuito, sin límite en Premium. Es el
 *    valor que se renueva cada mes, y lo único que cuesta dinero cada vez.
 *
 * Si la comprobación falla por un problema de la base de datos se deja pasar:
 * dejar sin asesora a todo el mundo porque falló una consulta de contabilidad
 * sería peor que el riesgo que evita. Por eso hay que verificar que el
 * contador sube de verdad y no fiarse de que la respuesta sea correcta.
 */
export async function consumirCupo(
  req: NextRequest,
  concepto: "catalogar" | "asesorar"
): Promise<Cupo> {
  try {
    const { data, error } = await clienteDeLaPeticion(req).rpc("consumir_cupo_asesor", {
      concepto_: concepto,
    });
    if (error) {
      console.error("[Dressé] no se pudo comprobar el cupo:", error.message);
      return { ok: true };
    }
    return (data as Cupo) ?? { ok: true };
  } catch (e) {
    console.error("[Dressé] no se pudo comprobar el cupo:", e);
    return { ok: true };
  }
}
