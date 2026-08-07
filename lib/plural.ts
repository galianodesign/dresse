/**
 * Concuerda un número con su palabra: "1 prenda", "5 prendas".
 *
 * Existe porque la app decía "1 prendas", "1 looks" y "1 seguidores" en once
 * sitios distintos. Es un detalle pequeño, pero es de los que hacen que algo
 * parezca sin terminar.
 *
 * Si no se indica el plural se le añade una "s", que vale para casi todo en
 * castellano. Para lo demás (seguidor → seguidores) se pasa a mano.
 */
export function plural(n: number, singular: string, enPlural?: string): string {
  return `${n} ${n === 1 ? singular : enPlural ?? `${singular}s`}`;
}

/**
 * Igual, pero devolviendo solo la palabra, sin el número. Útil cuando el
 * número ya va pintado aparte, por ejemplo más grande o en otro color.
 */
export function palabra(n: number, singular: string, enPlural?: string): string {
  return n === 1 ? singular : enPlural ?? `${singular}s`;
}
