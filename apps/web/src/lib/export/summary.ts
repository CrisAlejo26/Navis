import { NEUTRAL_ACCENT, type ExportCell } from '@/lib/export/columns';
import type { ExportDocument } from '@/lib/export/document';

export interface SummaryEntry {
  label: string;
  count: number;
  accent: string;
}

export interface SummaryBlock {
  /** El encabezado de la columna de la que sale: «Estado», «Sede», «Dones». */
  label: string;
  entries: SummaryEntry[];
}

/**
 * La hoja «Resumen» del Excel (RFC 0009 D8), contada **sobre las filas
 * exportadas** y no pidiéndole al servidor su resumen: si el resumen viniera de
 * otra consulta, tarde o temprano diría 213 en una hoja donde hay 47 filas. El
 * fichero tiene que ser coherente consigo mismo por construcción.
 *
 * Y sale solo: se cuenta **toda columna de etiquetas**, que es justamente lo
 * que tiene sentido agrupar —estado, sede, labores, dones, emociones— sin que
 * ningún módulo tenga que declarar sus propios bloques.
 */
export function buildSummary(doc: ExportDocument, emptyLabel: string): SummaryBlock[] {
  return doc.headers
    .map((label, index) => ({ label, entries: countColumn(doc.rows, index, emptyLabel) }))
    .filter((block) => block.entries.length > 0);
}

function countColumn(
  rows: readonly ExportCell[][],
  index: number,
  emptyLabel: string,
): SummaryEntry[] {
  const counts = new Map<string, SummaryEntry>();
  let isTagColumn = false;

  for (const row of rows) {
    const cell = row[index];
    if (cell?.kind !== 'tags') continue;
    isTagColumn = true;

    // Sin ninguna etiqueta cuenta igual, y bajo su propio nombre: «sin sede» es
    // de las cuentas que más se miran, y callarla la haría desaparecer.
    const tags = cell.tags.length > 0 ? cell.tags : [{ text: emptyLabel, accent: NEUTRAL_ACCENT }];
    for (const tag of tags) add(counts, tag.text, tag.accent);
  }

  if (!isTagColumn) return [];

  return [...counts.values()].sort((one, other) => other.count - one.count);
}

function add(counts: Map<string, SummaryEntry>, label: string, accent: string): void {
  const found = counts.get(label);
  if (found) found.count += 1;
  else counts.set(label, { label, count: 1, accent });
}
