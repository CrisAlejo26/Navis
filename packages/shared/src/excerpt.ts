/** Cuánto de un texto largo viaja en un listado. Suficiente para tres líneas. */
const EXCERPT_LENGTH = 160;

/**
 * Las primeras letras de un texto largo, **cortadas en palabra**: partir a
 * mitad de una deja un final que se lee como un fallo. Si no hay espacio donde
 * cortar —una palabra larguísima—, se corta donde toque y ya.
 *
 * A la tercera vez que este cálculo se repetía igual —profecías, sueños y
 * ahora el cuaderno de la iglesia— se extrae (Regla 1 §5). La tarjeta de notas
 * del panel de inicio usa un recorte más corto y más simple a propósito: no es
 * el mismo caso, y se queda donde está.
 */
export function toExcerpt(text: string): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  if (flat.length <= EXCERPT_LENGTH) return flat;

  const cut = flat.slice(0, EXCERPT_LENGTH);
  const lastSpace = cut.lastIndexOf(' ');
  return `${lastSpace > EXCERPT_LENGTH / 2 ? cut.slice(0, lastSpace) : cut}…`;
}
