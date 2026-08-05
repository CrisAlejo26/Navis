import { accentColor } from '@/lib/accents';
import { cn } from '@/lib/cn';
import type { ExportCell } from '@/lib/export/columns';
import { plainText, type ExportDocument } from '@/lib/export/document';
import type { ExportFormat } from '@/lib/export/formats';

/** Cuántas filas y columnas caben en la muestra sin que deje de leerse. */
export const PREVIEW_ROWS = 8;
const PREVIEW_COLUMNS = 5;

/**
 * El interior de la hoja, que es lo que cambia con el formato (RFC 0009 §7.3).
 *
 * En Excel y PDF es una tabla con su fila de encabezados teñida; en Markdown y
 * CSV, texto monoespaciado con las barras o las comas donde de verdad van a
 * ir. La imagen usa la tabla, porque la imagen **es** la lámina.
 */
export function ExportPreviewBody({ doc, format }: { doc: ExportDocument; format: ExportFormat }) {
  const headers = doc.headers.slice(0, PREVIEW_COLUMNS);
  const rows = doc.rows.slice(0, PREVIEW_ROWS).map((row) => row.slice(0, PREVIEW_COLUMNS));

  if (format === 'markdown' || format === 'csv') {
    return (
      <pre className="px-3 py-2 leading-relaxed font-mono overflow-hidden text-[9px] whitespace-pre text-muted-foreground">
        {[headers, ...rows.map((row) => row.map(plainText))]
          .map((cells) => (format === 'csv' ? cells.join(',') : `| ${cells.join(' | ')} |`))
          .join('\n')}
      </pre>
    );
  }

  return (
    <table className="w-full table-fixed text-[9px]">
      <thead>
        <tr>
          {headers.map((header) => (
            <th
              key={header}
              className="px-2 py-1.5 font-semibold truncate bg-primary text-left text-primary-foreground"
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={index} className={cn(index % 2 === 1 && 'bg-muted/50')}>
            {row.map((cell, column) => (
              <td
                key={headers[column] ?? column}
                className={cn(
                  'px-2 py-1 truncate border-b',
                  doc.aligns[column] === 'right' && 'text-right tabular-nums',
                )}
              >
                <Cell cell={cell} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Las etiquetas llevan su color también en la muestra: es lo que se va a ver. */
function Cell({ cell }: { cell: ExportCell }) {
  if (cell.kind !== 'tags') return <>{plainText(cell)}</>;

  return (
    <span className="gap-1 flex flex-wrap">
      {cell.tags.map((tag) => (
        <span
          key={tag.text}
          style={{ color: accentColor(tag.accent) }}
          className="px-1 rounded-full bg-current/12"
        >
          {tag.text}
        </span>
      ))}
    </span>
  );
}
