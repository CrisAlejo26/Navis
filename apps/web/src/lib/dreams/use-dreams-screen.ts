import { useDreams, useEmotions } from '@navis/api-client';
import type {
    DreamListItem,
    DreamsQuery,
    EmotionWithCount,
    TableFilter,
    TableSort,
} from '@navis/shared';
import { useCallback } from 'react';

import { useDreamColumns } from '@/components/dreams/use-dream-columns';
import { api } from '@/lib/api';
import { serverSource, type DataTableSource } from '@/lib/data-table/source';
import type { DataTableColumn } from '@/lib/data-table/columns';
import { useDataTableState, type DataTableState } from '@/lib/data-table/use-data-table-state';
import { useLegacyFilterLinks } from '@/lib/data-table/use-legacy-filter-links';
import {
    dreamFiltersFromLegacy,
    dreamRange,
    LEGACY_DREAM_PARAMS,
    toDreamsQuery,
} from '@/lib/dreams/dreams-query';

const DEFAULT_SORTS: readonly TableSort[] = [{ columnId: 'dreamed', dir: 'desc' }];
/** La API ordena por una sola columna. */
const TABLE_OPTIONS = { singleSort: true };

export interface DreamsScreen {
    columns: DataTableColumn<DreamListItem>[];
    state: DataTableState;
    source: DataTableSource<DreamListItem>;
    /** El vocabulario, para pintar las pastillas del filtro con su color. */
    emotions: EmotionWithCount[];
    /** El tramo de noches puesto, para el botón de fechas de la cabecera. */
    range: { from: string; to: string };
    setRange: (range: { from: string; to: string }) => void;
    /** Lo que necesita el fichero de exportar, que trae más que la fila del listado. */
    query: DreamsQuery;
}

/**
 * Todo lo que necesita el listado de sueños, en un sitio.
 *
 * Se separa de la vista porque son dos cosas distintas: aquí están la consulta y el
 * estado de la tabla; en el componente, cómo se pinta (Regla 6 §2). No hay permisos
 * que mirar: quien entra ve los suyos y solo los suyos (RFC 0005 D1, D2).
 */
export function useDreamsScreen(handlers: {
    onEdit: (dream: DreamListItem) => void;
    onDelete: (dream: DreamListItem) => void;
}): DreamsScreen {
    const emotions = useEmotions(api).data;
    const list = emotions ?? EMPTY_EMOTIONS;

    const columns = useDreamColumns({ emotions: list, ...handlers });
    const state = useDataTableState('dreams', columns, DEFAULT_SORTS, TABLE_OPTIONS);
    // Las tarjetas de la portada y las celdas de la franja enlazan con parámetros
    // sueltos (`?emotion=…`, `?from=…&to=…`): se traducen a los filtros de la tabla.
    useLegacyFilterLinks(state, LEGACY_DREAM_PARAMS, dreamFiltersFromLegacy);

    const query = toDreamsQuery(state.request);
    const result = useDreams(api, query);

    const { setColumnFilter } = state;
    const setRange = useCallback(
        (range: { from: string; to: string }) => {
            const filter: TableFilter | null =
                range.from || range.to
                    ? {
                          columnId: 'dreamed',
                          operator: 'between',
                          value: { from: range.from || undefined, to: range.to || undefined },
                      }
                    : null;
            setColumnFilter('dreamed', filter);
        },
        [setColumnFilter],
    );

    return {
        columns,
        state,
        source: serverSource(result),
        emotions: list,
        range: dreamRange(state.request.filters),
        setRange,
        query,
    };
}

const EMPTY_EMOTIONS: EmotionWithCount[] = [];
