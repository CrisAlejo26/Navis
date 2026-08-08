/** Minúsculas y sin acentos, para comparar sin que «Almeria» falle por la tilde. */
function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/**
 * Si una opción del combobox de país o comunidad coincide con lo escrito
 * (RFC 0011, ampliación): por su nombre o por su código.
 */
export function matchesQuery(label: string, hint: string | undefined, query: string): boolean {
  if (!query.trim()) return true;
  const needle = normalize(query);
  return normalize(label).includes(needle) || (hint ? normalize(hint).includes(needle) : false);
}
