import type { CustomTableColumn, RowData } from '@navis/shared';

import {
  cellDay,
  cellNumber,
  cellTag,
  cellTags,
  cellText,
  type ExportCell,
  type ExportColumn,
} from '@/lib/export/columns';

/**
 * Las columnas de la exportación, calculadas desde las columnas activas de la
 * tabla (RFC 0021 D23): añadir una columna la añade a la exportación sola,
 * como ya hace la barra de filtros (D28).
 */
export function tableExportColumns(
  columns: readonly CustomTableColumn[],
  includePasswords: boolean,
  yesNo: { yes: string; no: string },
): ExportColumn<RowData>[] {
  return columns
    .filter((column) => column.isActive && (column.type !== 'password' || includePasswords))
    .map((column) => ({
      key: column.key,
      header: column.label,
      value: (row: RowData) => cellFor(column, row[column.key], yesNo),
    }));
}

function cellFor(
  column: CustomTableColumn,
  value: unknown,
  yesNo: { yes: string; no: string },
): ExportCell {
  if (value === null || value === undefined || value === '') return cellText('');

  if (column.type === 'date' && typeof value === 'string') return cellDay(value);
  if ((column.type === 'number' || column.type === 'currency') && typeof value === 'number') {
    return cellNumber(value);
  }
  if (column.type === 'checkbox') return cellText(value ? yesNo.yes : yesNo.no);

  if (column.type === 'single_select' && typeof value === 'string') {
    const option = column.options?.find((one) => one.value === value);
    return cellTag(option?.label ?? value, option?.color ?? 'primary');
  }

  if (column.type === 'multi_select' && Array.isArray(value)) {
    return cellTags(
      value.map((one) => {
        const option = column.options?.find((opt) => opt.value === one);
        return { text: option?.label ?? String(one), accent: option?.color ?? 'primary' };
      }),
    );
  }

  // Lo que llega aquí es texto, correo, teléfono o URL. Un objeto no debería
  // aparecer nunca en esta rama, pero `String()` lo convertiría en
  // «[object Object]» sin avisar (Regla 10).
  return cellText(typeof value === 'string' || typeof value === 'number' ? String(value) : '');
}
