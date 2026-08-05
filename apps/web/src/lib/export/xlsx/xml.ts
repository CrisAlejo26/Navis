export const XML_HEADER = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

/**
 * Los caracteres de control que **no existen** en XML 1.0.
 *
 * Se deja fuera el tabulador, el salto de línea y el retorno, que sí son
 * válidos. El resto, si se cuela en una nota copiada de algún sitio, hace que
 * Excel no abra el fichero: se queja de contenido ilegible y ofrece repararlo.
 *
 * Va construido desde una cadena y no con una expresión literal para que en el
 * código fuente se lean los códigos y no aparezcan los caracteres de verdad,
 * que son invisibles y no sobreviven a un copiar y pegar.
 */
const CONTROL = new RegExp('[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F]', 'g');

/** Lo que no puede ir tal cual dentro de un XML. El `&` va primero, o se doblaría. */
export function escapeXml(value: string): string {
  return value
    .replace(CONTROL, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** 1 → `A`, 27 → `AA`. Las columnas de Excel se numeran en base 26 sin cero. */
export function columnLetter(index: number): string {
  let resto = index;
  let letras = '';

  while (resto > 0) {
    const posicion = (resto - 1) % 26;
    letras = String.fromCharCode(65 + posicion) + letras;
    resto = Math.floor((resto - posicion) / 26);
  }

  return letras;
}

/** `(2, 5)` → `B5`. */
export function cellRef(column: number, row: number): string {
  return `${columnLetter(column)}${String(row)}`;
}
