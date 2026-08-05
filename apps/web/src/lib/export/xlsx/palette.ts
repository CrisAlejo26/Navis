import { accentHex } from '@/lib/accents';
import type { ExportDocument } from '@/lib/export/document';
import type { SummaryBlock } from '@/lib/export/summary';

/** El azul de la marca, que es el de la banda del encabezado (RFC 0009 D9). */
export const BRAND = 'FF2140CF';

/** El fondo de la línea de filtros: el mismo azul al 8 % sobre blanco. */
export const SUBTITLE_BG = 'FFEEF1FC';

/** La cebra de las filas pares. Al 3 %: se nota y no ensucia. */
export const ZEBRA = 'FFF6F7FB';

/** El borde fino de debajo de cada fila. */
export const RULE = 'FFE3E6EF';

/**
 * Los acentos distintos que aparecen, en orden estable.
 *
 * Cada uno se convierte en una fuente y un relleno de `styles.xml`, así que la
 * lista tiene que ser la misma al construir los estilos y al escribir las
 * celdas. Sale del documento **y** del resumen porque los dos pintan
 * etiquetas.
 */
export function collectAccents(doc: ExportDocument, summary: readonly SummaryBlock[]): string[] {
  const found = new Set<string>();

  for (const row of doc.rows) {
    for (const cell of row) {
      if (cell.kind === 'tags') for (const tag of cell.tags) found.add(tag.accent);
    }
  }
  for (const block of summary) for (const entry of block.entries) found.add(entry.accent);

  return [...found];
}

/**
 * `#2140cf` → `FF2140CF`, que es como Excel escribe un color: alfa delante y
 * en mayúsculas.
 *
 * Se resuelve **siempre en tema claro** y a propósito: una hoja de cálculo no
 * tiene tema, es blanca (RFC 0009 D9).
 */
export function toArgb(accent: string): string {
  return `FF${accentHex(accent, 'light').replace('#', '').toUpperCase()}`;
}

/**
 * El mismo color mezclado con blanco, que es el relleno de una etiqueta.
 *
 * Al 15 %: por debajo del 12 % un tinte deja de verse (RFC 0005 §7.1.3), y el
 * texto va en el acento puro, que sobre su propio tinte claro se lee de sobra.
 */
export function tint(accent: string, ratio = 0.15): string {
  const hex = accentHex(accent, 'light').replace('#', '');
  const canal = (offset: number) => {
    const valor = Number.parseInt(hex.slice(offset, offset + 2), 16);
    return Math.round(valor * ratio + 255 * (1 - ratio));
  };

  const mezcla = [canal(0), canal(2), canal(4)]
    .map((valor) => valor.toString(16).padStart(2, '0'))
    .join('');

  return `FF${mezcla.toUpperCase()}`;
}
