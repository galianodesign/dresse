/**
 * Edad mínima para usar Dressé.
 *
 * En España, por debajo de los 14 años el tratamiento de datos personales
 * necesita el consentimiento de quien tenga la patria potestad o la tutela
 * (art. 7 de la LOPDGDD). Pedir ese consentimiento y comprobarlo de verdad es
 * un sistema entero que hoy no tenemos, así que la aplicación no admite
 * menores de 14.
 *
 * ⚠️ Esto es una declaración, no una comprobación: nadie verifica que la fecha
 * sea cierta. Es lo que hacen las aplicaciones que no piden el DNI, y es lo
 * que la ley espera de un servicio de este tamaño, pero conviene no confundir
 * una cosa con la otra. Si algún día se sabe que una cuenta es de un menor de
 * 14, hay que borrarla.
 */
export const EDAD_MINIMA = 14;

/** Los años cumplidos a día de hoy. Devuelve null si la fecha no vale. */
export function calcularEdad(iso: string): number | null {
  if (!iso) return null;

  const nacimiento = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(nacimiento.getTime())) return null;

  // JavaScript no rechaza el 30 de febrero: lo convierte en el 2 de marzo. Si
  // la fecha no vuelve a escribirse igual, es que no existía en el calendario.
  const local = `${nacimiento.getFullYear()}-${String(nacimiento.getMonth() + 1).padStart(2, "0")}-${String(nacimiento.getDate()).padStart(2, "0")}`;
  if (local !== iso) return null;

  const hoy = new Date();
  if (nacimiento > hoy) return null; // nacida en el futuro

  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  // Si aún no ha llegado su cumpleaños este año, todavía no los ha cumplido
  const cumpleEsteAno =
    hoy.getMonth() > nacimiento.getMonth() ||
    (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() >= nacimiento.getDate());
  if (!cumpleEsteAno) edad -= 1;

  if (edad > 120) return null; // se ha equivocado al escribir el año
  return edad;
}

/**
 * Revisa una fecha escrita a mano y devuelve el motivo del rechazo, o null si
 * es válida. El texto se enseña tal cual, así que va en castellano llano.
 */
export function revisarNacimiento(iso: string): string | null {
  if (!iso) return "Escribe tu fecha de nacimiento.";

  const edad = calcularEdad(iso);
  if (edad === null) return "Esa fecha no parece correcta. Revísala.";
  if (edad < EDAD_MINIMA)
    return `Lo sentimos: para usar Dressé hay que tener al menos ${EDAD_MINIMA} años.`;

  return null;
}

/** La fecha más reciente que se puede elegir: la de quien cumple hoy la edad mínima. */
export function fechaMaxima(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - EDAD_MINIMA);
  return d.toISOString().slice(0, 10);
}
