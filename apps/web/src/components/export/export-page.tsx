import type { RefObject } from 'react';

import { accentHex } from '@/lib/accents';
import type { ExportCell } from '@/lib/export/columns';
import { plainText, type ExportDocument } from '@/lib/export/document';
import { pillStyle, SHEET_HEIGHT, styles } from '@/components/export/export-page-styles';

/**
 * La lámina que se rasteriza: lo que acaba siendo la imagen y cada página del
 * PDF (RFC 0009 D6).
 *
 * Se pinta **a tamaño real fuera de la vista** y con estilos en línea, porque
 * es lo único que sabe rasterizar `nodeToPng`. No es la tabla de la pantalla
 * reducida: es una composición aparte, igual que la lámina del calendario.
 */
export function ExportPage({
  doc,
  rows,
  page,
  pages,
  sheetRef,
  fixedHeight = true,
}: {
  doc: ExportDocument;
  /** Las filas de **esta** página, ya recortadas. */
  rows: readonly ExportCell[][];
  page: number;
  pages: number;
  sheetRef?: RefObject<HTMLDivElement | null>;
  /** La imagen crece con sus filas; una página de PDF mide siempre lo mismo. */
  fixedHeight?: boolean;
}) {
  const total = doc.widths.reduce((sum, width) => sum + width, 0);

  return (
    <div
      ref={sheetRef}
      style={{ ...styles.sheet, ...(fixedHeight ? { height: `${String(SHEET_HEIGHT)}px` } : {}) }}
    >
      <div style={styles.band}>{doc.title}</div>
      <div style={styles.subtitle}>{doc.subtitle}</div>

      <table style={styles.table}>
        <colgroup>
          {doc.widths.map((width, index) => (
            <col
              key={doc.headers[index] ?? index}
              style={{ width: `${String((width / total) * 100)}%` }}
            />
          ))}
        </colgroup>
        <thead>
          <tr>
            {doc.headers.map((header) => (
              <th key={header} style={styles.th}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} style={index % 2 === 1 ? { backgroundColor: '#f6f7fb' } : undefined}>
              {row.map((cell, column) => (
                <td
                  key={doc.headers[column] ?? column}
                  style={{
                    ...styles.td,
                    textAlign: doc.aligns[column] === 'right' ? 'right' : 'left',
                  }}
                >
                  <Cell cell={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ flex: 1 }} />
      <div style={styles.footer}>
        <span>Navis</span>
        <span>
          {String(page)} / {String(pages)}
        </span>
      </div>
    </div>
  );
}

/** Las etiquetas van en pastillas con su color; lo demás, en texto plano. */
function Cell({ cell }: { cell: ExportCell }) {
  if (cell.kind !== 'tags') return <>{plainText(cell)}</>;

  return (
    <>
      {cell.tags.map((tag) => (
        <span key={tag.text} style={pillStyle(accentHex(tag.accent, 'light'))}>
          {tag.text}
        </span>
      ))}
    </>
  );
}
