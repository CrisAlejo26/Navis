import { plainText, type ExportDocument } from '@/lib/export/document';

/**
 * El listado en Markdown, para pegarlo en un acta, un documento o un correo.
 *
 * Lleva su título y la línea de filtros: aquí sí, porque esto lo lee una
 * persona y lo primero que se pregunta al ver una tabla pegada en un acta es
 * de qué es y de cuándo.
 */
export function toMarkdown(doc: ExportDocument): string {
  const separador = doc.aligns.map((align) => (align === 'right' ? '---:' : ':---'));

  return [
    `# ${doc.title}`,
    '',
    `_${doc.subtitle}_`,
    '',
    fila(doc.headers),
    fila(separador),
    ...doc.rows.map((row) => fila(row.map(plainText))),
    '',
  ].join('\n');
}

export function toMarkdownBlob(doc: ExportDocument): Blob {
  return new Blob([toMarkdown(doc)], { type: 'text/markdown;charset=utf-8' });
}

function fila(cells: readonly string[]): string {
  return `| ${cells.map(escape).join(' | ')} |`;
}

/**
 * La barra vertical parte la tabla en dos columnas donde no toca, y el salto
 * de línea la parte en dos filas. Los dos se escapan; el resto del Markdown
 * dentro de una celda es problema de quien lo escribió.
 */
function escape(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}
