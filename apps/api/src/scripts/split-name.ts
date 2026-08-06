/**
 * Partir un nombre completo en nombre y apellidos.
 *
 * En español lo normal son **dos apellidos**: «Luz Fabiola Villada Serna» es
 * «Luz Fabiola» + «Villada Serna», y «Yolanda Zapata Duque» es «Yolanda» +
 * «Zapata Duque». Con tres palabras o más se cogen las dos últimas; con dos,
 * una; con una, ninguna.
 *
 * Es una **heurística y falla**: «Ana de la Cruz» o alguien con un solo
 * apellido saldrán mal partidos. Se acepta a conciencia porque la ficha se
 * puede corregir a mano en un segundo, y porque la alternativa —dejarlo todo en
 * el nombre— rompe el orden alfabético del listado, que es por apellido.
 */
export function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);

  if (parts.length <= 1) return { firstName: parts[0] ?? '', lastName: '' };
  if (parts.length === 2) return { firstName: parts[0], lastName: parts[1] };

  return {
    firstName: parts.slice(0, -2).join(' '),
    lastName: parts.slice(-2).join(' '),
  };
}
