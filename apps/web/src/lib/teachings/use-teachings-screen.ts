import { useTeachings } from '@navis/api-client';
import type { TableSort, TeachingListItem } from '@navis/shared';

import { useTeachingColumns } from '@/components/teachings/use-teaching-columns';
import { api } from '@/lib/api';
import type { DataTableColumn } from '@/lib/data-table/columns';
import { serverSource, type DataTableSource } from '@/lib/data-table/source';
import { useDataTableState, type DataTableState } from '@/lib/data-table/use-data-table-state';
import { toTeachingsQuery } from '@/lib/teachings/teachings-query';

const DEFAULT_SORTS: readonly TableSort[] = [{ columnId: 'received', dir: 'desc' }];
/** La API ordena por una sola columna. */
const TABLE_OPTIONS = { singleSort: true };

export interface TeachingsScreen {
    columns: DataTableColumn<TeachingListItem>[];
    state: DataTableState;
    source: DataTableSource<TeachingListItem>;
}

/**
 * Todo lo que necesita el listado de enseñanzas, en un sitio (RFC 0022 §4.4).
 *
 * Sin permisos que mirar: quien entra ve las suyas y solo las suyas.
 */
export function useTeachingsScreen(handlers: {
    onEdit: (teaching: TeachingListItem) => void;
    onDelete: (teaching: TeachingListItem) => void;
}): TeachingsScreen {
    const columns = useTeachingColumns(handlers);
    const state = useDataTableState('teachings', columns, DEFAULT_SORTS, TABLE_OPTIONS);
    const result = useTeachings(api, toTeachingsQuery(state.request));

    return { columns, state, source: serverSource(result) };
}
