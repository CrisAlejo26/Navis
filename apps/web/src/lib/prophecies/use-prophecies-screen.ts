import { useProphecies } from '@navis/api-client';
import type { PropheciesQuery, ProphecyListItem, TableFilter, TableSort } from '@navis/shared';
import { useCallback } from 'react';

import { useProphecyColumns } from '@/components/prophecies/use-prophecy-columns';
import { api } from '@/lib/api';
import type { DataTableColumn } from '@/lib/data-table/columns';
import { serverSource, type DataTableSource } from '@/lib/data-table/source';
import { useDataTableState, type DataTableState } from '@/lib/data-table/use-data-table-state';
import { useLegacyFilterLinks } from '@/lib/data-table/use-legacy-filter-links';
import {
    LEGACY_PROPHECY_PARAMS,
    prophecyFiltersFromLegacy,
    prophecyRange,
    toPropheciesQuery,
} from '@/lib/prophecies/prophecies-query';

const DEFAULT_SORTS: readonly TableSort[] = [{ columnId: 'received', dir: 'desc' }];
/** La API ordena por una sola columna. */
const TABLE_OPTIONS = { singleSort: true };

export interface PropheciesScreen {
    columns: DataTableColumn<ProphecyListItem>[];
    state: DataTableState;
    source: DataTableSource<ProphecyListItem>;
    /** El tramo de recepción puesto, para el botón de fechas de la cabecera. */
    range: { from: string; to: string };
    setRange: (range: { from: string; to: string }) => void;
    /** Lo que necesita el fichero de exportar, que trae más que la fila del listado. */
    query: PropheciesQuery;
}

/**
 * Todo lo que necesita el listado de profecías, en un sitio.
 *
 * Se separa de la vista porque son dos cosas distintas: aquí están la consulta y el
 * estado de la tabla; en el componente, cómo se pinta (Regla 6 §2). No hay permisos
 * que mirar: quien entra ve las suyas y solo las suyas (RFC 0004 D1, D2).
 */
export function usePropheciesScreen(handlers: {
    onEdit: (prophecy: ProphecyListItem) => void;
    onFulfill: (prophecy: ProphecyListItem) => void;
    onDelete: (prophecy: ProphecyListItem) => void;
}): PropheciesScreen {
    const columns = useProphecyColumns(handlers);
    const state = useDataTableState('prophecies', columns, DEFAULT_SORTS, TABLE_OPTIONS);
    // Las tarjetas de la portada enlazan con parámetros sueltos (`?state=espera`,
    // `?window=year`…): se traducen una vez a los filtros de la tabla.
    useLegacyFilterLinks(state, LEGACY_PROPHECY_PARAMS, prophecyFiltersFromLegacy);

    const query = toPropheciesQuery(state.request);
    const result = useProphecies(api, query);

    const { setColumnFilter } = state;
    const setRange = useCallback(
        (range: { from: string; to: string }) => {
            const filter: TableFilter | null =
                range.from || range.to
                    ? {
                          columnId: 'received',
                          operator: 'between',
                          value: { from: range.from || undefined, to: range.to || undefined },
                      }
                    : null;
            setColumnFilter('received', filter);
        },
        [setColumnFilter],
    );

    return {
        columns,
        state,
        source: serverSource(result),
        range: prophecyRange(state.request.filters),
        setRange,
        query,
    };
}
