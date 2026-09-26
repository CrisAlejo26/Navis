import type { CustomTableColumn, CustomTableRow } from '@navis/shared';
import { AlertTriangle } from 'lucide-react';
import { type useTranslation } from 'react-i18next';

import { BoundCell } from '@/components/tables/bound-cell';
import { RowActions } from '@/components/tables/row-actions';
import type { DataTableColumn } from '@/lib/data-table/columns';
import { cellValueOf, columnSpec } from '@/lib/tables/row-columns';

interface Options {
    editable: boolean;
    /** La tabla enlazada al listado de creyentes: la fila puede haberse quedado sin él (RFC 0025). */
    linked?: boolean;
    /** Si la fila acaba de llegar, la posición de la columna dentro de ella (animación D16). */
    arrival: (row: CustomTableRow, index: number) => number | undefined;
    onEdit: (row: CustomTableRow) => void;
    onDelete: (row: CustomTableRow) => void;
}

/**
 * Las columnas de la cuadrícula de una tabla personalizada: una por columna
 * **activa**, con la celda de siempre (`BoundCell`) y, si se puede editar, la de
 * acciones. Se construyen sobre `columnSpec`, que es lo que ya conoce el estado.
 *
 * Los filtros de selección sacan sus opciones de la propia columna.
 */
export function buildRowColumns(
    columns: readonly CustomTableColumn[],
    options: Options,
    t: ReturnType<typeof useTranslation>['t'],
): DataTableColumn<CustomTableRow>[] {
    const { editable, linked, arrival, onEdit, onDelete } = options;

    const data: DataTableColumn<CustomTableRow>[] = columns.map((column) => ({
        ...columnSpec(column),
        label: column.label,
        value: (row) => cellValueOf(row.data[column.key]),
        options: (column.options ?? []).map((one) => ({
            value: one.value,
            label: one.label,
            accent: one.color,
        })),
        cell: (row, index) => (
            <BoundCell column={column} row={row} linked={linked} arrival={arrival(row, index)} />
        ),
    }));
    if (!editable) return data;

    return [
        ...data,
        {
            id: 'actions',
            kind: 'text',
            label: t('common.actions'),
            header: <span className="sr-only">{t('common.actions')}</span>,
            sortable: false,
            hideable: false,
            align: 'right',
            cell: (row) => (
                <span className="gap-1 flex items-center justify-end">
                    {linked && !row.believer && (
                        <span title={t('tables.believerGone')} className="text-warning">
                            <AlertTriangle size={14} aria-hidden />
                            <span className="sr-only">{t('tables.believerGone')}</span>
                        </span>
                    )}
                    <RowActions
                        compact
                        onEdit={() => {
                            onEdit(row);
                        }}
                        onDelete={() => {
                            onDelete(row);
                        }}
                    />
                </span>
            ),
        },
    ];
}
