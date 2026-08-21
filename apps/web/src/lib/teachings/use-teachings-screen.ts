import { useTeachings, useTeachingsStats } from '@navis/api-client';
import {
  DEFAULT_TEACHING_SORT,
  TEACHING_SORT_FIELDS,
  type Paginated,
  type TeachingListItem,
  type TeachingsStats,
} from '@navis/shared';

import { api } from '@/lib/api';
import { useTableQuery, type TableQuery } from '@/lib/use-table-query';

export interface TeachingsScreen {
  query: TableQuery<(typeof TEACHING_SORT_FIELDS)[number]>;
  page: Paginated<TeachingListItem> | undefined;
  stats: TeachingsStats | undefined;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

/**
 * Todo lo que necesita el listado de enseñanzas, en un sitio (RFC 0022 §4.4).
 *
 * Sin permisos que mirar: quien entra ve las suyas y solo las suyas.
 */
export function useTeachingsScreen(): TeachingsScreen {
  const query = useTableQuery({
    fields: TEACHING_SORT_FIELDS,
    sort: DEFAULT_TEACHING_SORT,
    order: 'desc',
  });

  const list = useTeachings(api, {
    page: query.page,
    limit: query.limit,
    search: query.search || undefined,
    sort: query.sort,
    order: query.order,
  });

  const stats = useTeachingsStats(api);

  return {
    query,
    page: list.data,
    stats: stats.data,
    isLoading: list.isFetching && !list.data,
    isError: list.isError,
    refetch: () => {
      void list.refetch();
    },
  };
}
