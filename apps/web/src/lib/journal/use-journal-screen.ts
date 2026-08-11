import { useJournal, useJournalStats } from '@navis/api-client';
import {
  DEFAULT_JOURNAL_SORT,
  JOURNAL_SORT_FIELDS,
  todayIn,
  type IsoDate,
  type JournalEntryListItem,
  type JournalStats,
  type Paginated,
} from '@navis/shared';

import { api } from '@/lib/api';
import { useJournalFilters, type JournalFilters } from '@/lib/journal/filters';
import { useTableQuery, type TableQuery } from '@/lib/use-table-query';

export interface JournalScreen {
  query: TableQuery<(typeof JOURNAL_SORT_FIELDS)[number]>;
  filters: JournalFilters;
  page: Paginated<JournalEntryListItem> | undefined;
  /** Las cuentas que llevan dentro las pastillas de tipo (§7.4). */
  stats: JournalStats | undefined;
  today: IsoDate;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

/**
 * Todo lo que necesita el listado del cuaderno, en un sitio.
 *
 * Se separa de la vista porque son dos cosas distintas: aquí están la
 * consulta, los filtros de la URL y el día de hoy; en el componente, cómo se
 * pinta (Regla 6 §2). Es de la iglesia activa (D1): sin comprobar permisos
 * aquí, porque el guard de la ruta ya exige `journal.view`.
 */
export function useJournalScreen(): JournalScreen {
  const query = useTableQuery({
    fields: JOURNAL_SORT_FIELDS,
    sort: DEFAULT_JOURNAL_SORT,
    order: 'desc',
  });
  const filters = useJournalFilters();

  const list = useJournal(api, {
    page: query.page,
    limit: query.limit,
    search: query.search || undefined,
    kind: filters.kind,
    window: filters.window,
    // El tramo a medida manda sobre la ventana rápida: el servidor usa `from`
    // en cuanto llega y deja de calcularlo desde `window` (§6.1).
    from: filters.from || undefined,
    to: filters.to || undefined,
    pendingReminder: filters.pendingReminder || undefined,
    sort: query.sort,
    order: query.order,
  });

  const stats = useJournalStats(api);

  return {
    query,
    filters,
    page: list.data,
    stats: stats.data,
    // El día de quien mira: el del servidor y el del cliente pueden discrepar
    // en el cambio de día, y el que se está viendo es este.
    today: todayIn(Intl.DateTimeFormat().resolvedOptions().timeZone),
    isLoading: list.isFetching && !list.data,
    isError: list.isError,
    refetch: () => {
      void list.refetch();
    },
  };
}
