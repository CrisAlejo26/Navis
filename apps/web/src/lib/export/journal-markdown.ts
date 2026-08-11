import type { JournalExportRow } from '@navis/shared';

import { buildZip, utf8 } from '@/lib/export/zip';
import { slugify } from '@/lib/share/files';

/** Los textos, ya traducidos: esto es una función pura y no sabe de i18next. */
export interface JournalMarkdownLabels {
  frontmatterTitle: string;
  frontmatterKind: string;
  frontmatterDate: string;
  frontmatterReminder: string;
  annotationHeading: string;
  learnedHeading: string;
}

/** `2026-08-12T19:00:00.000Z` → `2026-08-12 19:00`: sencillo y ordenable, sin palabras de ningún idioma. */
function toPlainDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  const dos = (value: number) => String(value).padStart(2, '0');
  return `${String(date.getFullYear())}-${dos(date.getMonth() + 1)}-${dos(date.getDate())} ${dos(date.getHours())}:${dos(date.getMinutes())}`;
}

/**
 * Una entrada, en Markdown (RFC 0017 D12, §7.9): una pequeña cabecera de
 * metadatos y el texto entero debajo.
 *
 * La cabecera se traduce a la vez que el contenido: quien exporta en alemán
 * recibe `titel`, `art`, `datum` — son los `labels` que llegan de fuera.
 */
export function toEntryMarkdown(
  row: JournalExportRow,
  kindLabel: string,
  labels: JournalMarkdownLabels,
): string {
  const frontmatter = [
    `${labels.frontmatterTitle}: ${row.title}`,
    `${labels.frontmatterKind}: ${kindLabel}`,
    `${labels.frontmatterDate}: ${row.occurredAt}`,
  ];

  if (row.remindAt) {
    const mensaje = row.remindText ? ` — ${row.remindText}` : '';
    frontmatter.push(`${labels.frontmatterReminder}: ${toPlainDateTime(row.remindAt)}${mensaje}`);
  }

  const cuerpo = [
    '---',
    ...frontmatter,
    '---',
    '',
    `# ${row.title}`,
    '',
    `## ${labels.annotationHeading}`,
    '',
    row.annotation,
  ];

  if (row.learned) {
    cuerpo.push('', `## ${labels.learnedHeading}`, '', row.learned);
  }

  return `${cuerpo.join('\n')}\n`;
}

export function toEntryMarkdownBlob(
  row: JournalExportRow,
  kindLabel: string,
  labels: JournalMarkdownLabels,
): Blob {
  return new Blob([toEntryMarkdown(row, kindLabel, labels)], {
    type: 'text/markdown;charset=utf-8',
  });
}

/**
 * Varias entradas, en un `.zip` con un `.md` por entrada (D12).
 *
 * Reutiliza `lib/export/zip.ts` **tal cual**: el mismo escritor «store» sin
 * comprimir que ya usa el `.xlsx` (Regla 1 §5, no son dos cosas parecidas, es
 * la misma). Se descartó concatenar todo en un solo fichero: quince entradas
 * largas en un documento gigante es peor de manejar que quince ficheros
 * sueltos que se abren uno a uno.
 */
export function toEntriesZip(
  rows: readonly JournalExportRow[],
  kindLabel: (row: JournalExportRow) => string,
  labels: JournalMarkdownLabels,
): Blob {
  const usados = new Map<string, number>();

  const entries = rows.map((row) => {
    const base = slugify(row.title) || 'entrada';
    const veces = usados.get(base) ?? 0;
    usados.set(base, veces + 1);
    const nombre = veces === 0 ? `${base}.md` : `${base}-${String(veces + 1)}.md`;

    return { name: nombre, data: utf8(toEntryMarkdown(row, kindLabel(row), labels)) };
  });

  return buildZip(entries, 'application/zip');
}
