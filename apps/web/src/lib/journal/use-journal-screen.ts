import { useJournal } from '@navis/api-client';
import type { JournalEntryListItem, TableSort } from '@navis/shared';

import { useEntryColumns } from '@/components/journal/use-entry-columns';
import { api } from '@/lib/api';
import type { DataTableColumn } from '@/lib/data-table/columns';
import { serverSource, type DataTableSource } from '@/lib/data-table/source';
import { useDataTableState, type DataTableState } from '@/lib/data-table/use-data-table-state';
import { useLegacyFilterLinks } from '@/lib/data-table/use-legacy-filter-links';
import {
    LEGACY_JOURNAL_PARAMS,
    journalFiltersFromLegacy,
    toJournalQuery,
} from '@/lib/journal/journal-query';

const DEFAULT_SORTS: readonly TableSort[] = [{ columnId: 'date', dir: 'desc' }];
/** La API ordena por una sola columna. */
const TABLE_OPTIONS = { singleSort: true };

export interface JournalScreen {
    columns: DataTableColumn<JournalEntryListItem>[];
    state: DataTableState;
    source: DataTableSource<JournalEntryListItem>;
}

/**
 * Todo lo que necesita el listado del cuaderno, en un sitio.
 *
 * Se separa de la vista porque son dos cosas distintas: aquí están la consulta y el
 * estado de la tabla; en el componente, cómo se pinta (Regla 6 §2). Es de la iglesia
 * activa (D1): sin comprobar permisos aquí, porque el guard de la ruta ya exige
 * `journal.view`.
 */
export function useJournalScreen(handlers: {
    onEdit: (entry: JournalEntryListItem) => void;
    onDelete: (entry: JournalEntryListItem) => void;
}): JournalScreen {
    const columns = useEntryColumns(handlers);
    const state = useDataTableState('journal', columns, DEFAULT_SORTS, TABLE_OPTIONS);
    // Las tarjetas de la portada enlazan con parámetros sueltos (`?kind=…`,
    // `?pendingReminder=true`…): se traducen una vez a los filtros de la tabla.
    useLegacyFilterLinks(state, LEGACY_JOURNAL_PARAMS, journalFiltersFromLegacy);

    const result = useJournal(api, toJournalQuery(state.request));

    return { columns, state, source: serverSource(result) };
}
