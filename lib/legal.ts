/**
 * Datos identificativos que aparecen en los textos legales.
 *
 * Están todos aquí y no repartidos por las páginas para que se rellenen una
 * sola vez y no se quede ninguno olvidado.
 *
 * ⚠️ ESTE REPOSITORIO ES PÚBLICO. Lo que se escriba aquí queda en GitHub para
 * siempre, también si luego se borra: el historial de Git lo conserva. Poner
 * solo lo que la ley obligue a publicar, y nada más.
 */

export const TITULAR = {
  /** Nombre y apellidos, o razón social si algún día hay una sociedad */
  nombre: "Nacho Martín Galiano",

  /** Correo de contacto para privacidad y asuntos legales */
  email: "nmartingaliano@gmail.com",

  /**
   * NIF y domicilio.
   *
   * Hoy están vacíos a propósito, y los textos se adaptan solos cuando faltan.
   *
   * El RGPD (art. 13) solo pide identificar al responsable y dar un medio de
   * contacto: con el nombre y el correo se cumple. El domicilio y el NIF los
   * exige la LSSI-CE (art. 10), y esa ley se aplica a los servicios que
   * constituyen una actividad económica. Dressé hoy es gratuita, sin pagos ni
   * publicidad, así que todavía no es el caso.
   *
   * ⚠️ EN CUANTO SE COBRE POR ALGO (Premium, publicidad, lo que sea) ESTOS DOS
   * CAMPOS PASAN A SER OBLIGATORIOS, y además habrá que darse de alta como
   * autónomo. Cuando llegue ese momento, conviene pensarse si el domicilio que
   * se publica debe ser el de casa: una vez publicado no se puede retirar.
   */
  nif: "",
  direccion: "",

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
 * Lo que acompaña al nombre del titular: NIF y domicilio, si los hay.
 *
 * Devuelve la cadena ya montada con sus comas, o vacía si no hay ninguno de
 * los dos. Existe para que las páginas no repitan esta lógica ni queden
 * frases cojas del tipo "con NIF  y domicilio en ." cuando falte un dato.
 */
export function complementoTitular(): string {
  const partes: string[] = [];
  if (TITULAR.nif) partes.push(`con NIF ${TITULAR.nif}`);
  if (TITULAR.direccion) partes.push(`con domicilio en ${TITULAR.direccion}`);
  return partes.length ? `, ${partes.join(", ")}` : "";
}

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
