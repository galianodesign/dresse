/**
 * Datos identificativos que aparecen en los textos legales.
 *
 * ⚠️ HAY QUE RELLENAR LO QUE ESTÁ ENTRE ⟦⟧ ANTES DE ABRIR LA APP AL PÚBLICO.
 * La ley obliga a identificar de forma clara a quién está detrás del servicio
 * (RGPD art. 13 y LSSI-CE art. 10). Publicar con estos huecos sin rellenar es
 * peor que no tener los textos, porque queda por escrito que no se sabe quién
 * responde.
 *
 * Están todos aquí y no repartidos por las páginas para que se rellenen una
 * sola vez y no se quede ninguno olvidado.
 */

export const TITULAR = {
  /** Nombre y apellidos si eres autónomo, o razón social si es una sociedad */
  nombre: "⟦NOMBRE Y APELLIDOS O RAZÓN SOCIAL⟧",
  /** NIF / NIE / CIF */
  nif: "⟦NIF⟧",
  /** Domicilio a efectos de notificaciones */
  direccion: "⟦DIRECCIÓN POSTAL COMPLETA⟧",
  /** Correo de contacto para asuntos legales y de privacidad */
  email: "⟦CORREO DE CONTACTO⟧",
  /** Nombre comercial */
  marca: "Dressé",
  web: "https://dresse.vercel.app",
};

/**
 * Fecha de la última revisión de los textos. Si se cambia algo de fondo hay
 * que actualizarla y, si el cambio es importante, avisar a las usuarias.
 */
export const ACTUALIZADO = "6 de agosto de 2026";

/**
 * Empresas que tratan datos por encargo nuestro.
 *
 * ⚠️ Con cada una de ellas hace falta un contrato de encargado del tratamiento
 * (RGPD art. 28). Las cuatro lo ofrecen en sus condiciones, pero hay que
 * aceptarlo expresamente desde el panel de cada una: no basta con usar el
 * servicio.
 */
export const ENCARGADOS = [
  {
    nombre: "Supabase",
    para: "Guardar tu cuenta, tus datos y tus fotos.",
    donde: "Unión Europea (Fráncfort, Alemania)",
  },
  {
    nombre: "Vercel",
    para: "Servir la aplicación y registrar errores de funcionamiento.",
    donde: "Estados Unidos, con garantías contractuales para la transferencia",
  },
  {
    nombre: "Anthropic",
    para: "Analizar las fotos de tus prendas y generar los consejos de Madame Dressé.",
    donde: "Estados Unidos, con garantías contractuales para la transferencia",
  },
  {
    nombre: "Google",
    para: "Permitirte entrar con tu cuenta de Google, si eliges esa opción.",
    donde: "Estados Unidos, con garantías contractuales para la transferencia",
  },
];
