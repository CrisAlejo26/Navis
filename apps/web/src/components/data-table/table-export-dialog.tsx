import type { RowData as TableRowData } from '@tanstack/react-table';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useFilterText } from '@/components/data-table/filters/use-filter-text';
import { ExportSheet } from '@/components/export/export-sheet';
import type { DataTableColumn } from '@/lib/data-table/columns';
import type { TableExportConfig } from '@/lib/data-table/export-config';
import { toExportColumns } from '@/lib/data-table/export-columns';
import type { TableRequest } from '@/lib/data-table/types';
import {
    useRemoteExportRows,
    type ExportRows,
    type ExportScope,
} from '@/lib/data-table/use-export-rows';
import { buildDocument } from '@/lib/export/document';

interface TableExportDialogProps<TItem extends TableRowData> {
    open: boolean;
    onClose: () => void;
    scope: ExportScope;
    /** Las columnas **visibles y en su orden**: lo que se exporta es lo que se ve. */
    columns: readonly DataTableColumn<TItem>[];
    /** Todas, para poder decir un filtro con el nombre de una columna que se ha ocultado. */
    allColumns: readonly DataTableColumn<TItem>[];
    /** Lo que ya hay en la tabla; si la pantalla trae `fetchAll`, se sustituye por todo. */
    rows: ExportRows<TItem>;
    /** Modo servidor: la tabla solo tiene una página, y `fetchAll` puede traer el resto. */
    remote: boolean;
    tableId: string;
    config: TableExportConfig<TItem>;
    request: TableRequest;
}

/**
 * El diálogo de exportar de la tabla: el mismo de todas las pantallas (RFC 0009),
 * con Excel, PDF, imagen, Markdown y CSV. Aquí solo se arma el documento.
 *
 * La segunda línea del fichero dice **qué se llevó** —cuántas filas, con qué
 * búsqueda, filtros y orden—: un Excel sin esa línea es una tabla sin contexto
 * cuando se abre dos semanas después.
 */
export function TableExportDialog<TItem extends TableRowData>({
    open,
    onClose,
    scope,
    columns,
    allColumns,
    rows: localRows,
    remote,
    tableId,
    config,
    request,
}: TableExportDialogProps<TItem>) {
    const { t } = useTranslation();
    const filterText = useFilterText();
    const remoteRows = useRemoteExportRows({
        config,
        request,
        tableId,
        enabled: remote && scope === 'all',
    });
    const rows = remoteRows ?? localRows;

    const doc = useMemo(() => {
        if (rows.isLoading) return null;
        const byId = new Map(allColumns.map((column) => [column.id, column]));

        const sortText = request.sorts
            .map(
                (sort) =>
                    `${byId.get(sort.columnId)?.label ?? sort.columnId} ${sort.dir === 'asc' ? '↑' : '↓'}`,
            )
            .join(', ');

        const parts = [
            t('export.rows', { count: rows.items.length, total: rows.total }),
            scope === 'selection' ? t('dataTable.export.selectionOnly') : '',
            scope === 'all' && request.search ? `${t('dataTable.search')}: ${request.search}` : '',
            ...(scope === 'all'
                ? request.filters.flatMap((filter) => {
                      const column = byId.get(filter.columnId);
                      return column ? [filterText(filter, column)] : [];
                  })
                : []),
            sortText ? t('dataTable.sortStatus', { criteria: sortText }) : '',
        ].filter(Boolean);

        return buildDocument({
            label: config.label,
            title: config.title ?? config.label,
            subtitle: parts.join(' · '),
            columns: toExportColumns(columns, {
                yes: t('dataTable.filters.yes'),
                no: t('dataTable.filters.no'),
            }),
            rows: rows.items,
        });
    }, [rows, allColumns, columns, config, request, scope, t, filterText]);

    return (
        <ExportSheet
            open={open}
            onClose={onClose}
            doc={doc}
            total={rows.total}
            truncated={rows.truncated}
            isLoading={rows.isLoading}
        />
    );
}
