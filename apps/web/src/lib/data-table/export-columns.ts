import type { RowData as TableRowData } from '@tanstack/react-table';

import {
    cellDay,
    cellNumber,
    cellTag,
    cellText,
    type ExportCell,
    type ExportColumn,
} from '@/lib/export/columns';

import type { CellValue, DataTableColumn } from './columns';

export interface ExportLabels {
    yes: string;
    no: string;
}

/**
 * La celda de exportación de un valor en bruto, según el tipo de la columna.
 *
 * Un día es un día (`cellDay`) y no un texto: así Excel lo recibe como fecha de
 * verdad y no lo pinta el día anterior en un huso al oeste de Greenwich
 * (CLAUDE.md, `iso-day`). Una selección se exporta con **su etiqueta**, la que se
 * ve en la tabla, y no con el identificador interno.
 */
function autoCell<TItem extends TableRowData>(
    column: DataTableColumn<TItem>,
    value: CellValue,
    labels: ExportLabels,
): ExportCell {
    if (value === null || value === undefined || value === '') return cellText('');
    if (column.kind === 'date' && typeof value === 'string') return cellDay(value);
    if (column.kind === 'number' && typeof value === 'number') return cellNumber(value);
    if (typeof value === 'boolean') return cellText(value ? labels.yes : labels.no);
    if (column.kind === 'select') {
        const option = column.options?.find((candidate) => candidate.value === value);
        if (option?.accent) return cellTag(option.label, option.accent);
        return cellText(option?.label ?? String(value));
    }
    return cellText(String(value));
}

/**
 * Las columnas de exportación a partir de las de la tabla: **las mismas que se ven**
 * (visibles y en su orden) y ninguna que no tenga qué escribir en un fichero. El
 * escritor de Excel no sabe qué es un rol ni un creyente: recibe esto.
 */
export function toExportColumns<TItem extends TableRowData>(
    columns: readonly DataTableColumn<TItem>[],
    labels: ExportLabels,
): ExportColumn<TItem>[] {
    return columns
        .filter((column) => column.exportable !== false && (column.exportCell ?? column.value))
        .map((column) => ({
            key: column.id,
            header: column.label,
            align: column.align,
            value: (item: TItem) =>
                column.exportCell
                    ? column.exportCell(item)
                    : autoCell(column, column.value?.(item), labels),
        }));
}
