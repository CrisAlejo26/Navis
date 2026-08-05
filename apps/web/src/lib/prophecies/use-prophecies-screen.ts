import { useProphecies, usePropheciesStats } from '@navis/api-client';
import {
  DEFAULT_PROPHECY_SORT,
  PROPHECY_SORT_FIELDS,
  todayIn,
  type IsoDate,
  type Paginated,
  type PropheciesStats,
  type ProphecyListItem,
} from '@navis/shared';

import { api } from '@/lib/api';
import { useProphecyFilters, type ProphecyFilters } from '@/lib/prophecies/filters';
import { useTableQuery, type TableQuery } from '@/lib/use-table-query';

export interface PropheciesScreen {
  query: TableQuery<(typeof PROPHECY_SORT_FIELDS)[number]>;
  filters: ProphecyFilters;
  page: Paginated<ProphecyListItem> | undefined;
  /** Las cuentas que llevan dentro las pastillas de estado (§7.4). */
  stats: PropheciesStats | undefined;
  today: IsoDate;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

/**
 * Todo lo que necesita el listado de profecías, en un sitio.
 *
 * Se separa de la vista porque son dos cosas distintas: aquí están la consulta,
 * los filtros de la URL y el día de hoy; en el componente, cómo se pinta
 * (Regla 6 §2). No hay permisos que mirar: quien entra ve las suyas y solo las
 * suyas (RFC 0004 D1, D2).
 */
export function usePropheciesScreen(): PropheciesScreen {
  const query = useTableQuery({
    fields: PROPHECY_SORT_FIELDS,
    sort: DEFAULT_PROPHECY_SORT,
    order: 'desc',
  });
  const filters = useProphecyFilters();

  const list = useProphecies(api, {
    page: query.page,
    limit: query.limit,
    search: query.search || undefined,
    state: filters.state,
    window: filters.window,
    // El tramo a medida manda sobre la ventana rápida: el servidor usa `from`
    // en cuanto llega y deja de calcularlo desde `window` (RFC 0004 §6.1).
    from: filters.from || undefined,
    to: filters.to || undefined,
    sort: query.sort,
    order: query.order,
  });

  const stats = usePropheciesStats(api);

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
