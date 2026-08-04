import { useBelievers, useBelieversSummary, useCongregations, useGifts } from '@navis/api-client';
import {
  BELIEVER_SORT_FIELDS,
  DEFAULT_BELIEVER_SORT,
  todayIn,
  type BelieverListItem,
  type Congregation,
  type Gift,
  type IsoDate,
  type Paginated,
  type BelieversSummary,
} from '@navis/shared';
import { useMemo } from 'react';

import { api } from '@/lib/api';
import { useBelieverFilters, type BelieverFilters } from '@/lib/believers/filters';
import { usePermissions } from '@/lib/permissions';
import { useTableQuery, type TableQuery } from '@/lib/use-table-query';

export interface BelieversScreen {
  query: TableQuery<(typeof BELIEVER_SORT_FIELDS)[number]>;
  filters: BelieverFilters;
  page: Paginated<BelieverListItem> | undefined;
  summary: BelieversSummary | undefined;
  congregations: Congregation[];
  gifts: Gift[];
  /** La sede de cada persona, resuelta una vez y no en cada fila. */
  congregationOf: (id: string | null) => Congregation | undefined;
  today: IsoDate;
  canManage: boolean;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

/**
 * Todo lo que necesita la pantalla de creyentes, en un sitio.
 *
 * Se separa de la vista porque son dos cosas distintas: aquí están las cuatro
 * consultas, los filtros de la URL y los permisos; en el componente, cómo se
 * pinta (Regla 6 §2).
 */
export function useBelieversScreen(): BelieversScreen {
  const { can } = usePermissions();
  const query = useTableQuery({
    fields: BELIEVER_SORT_FIELDS,
    sort: DEFAULT_BELIEVER_SORT,
    order: 'asc',
  });
  const filters = useBelieverFilters();

  const list = useBelievers(api, {
    page: query.page,
    limit: query.limit,
    search: query.search || undefined,
    status: filters.status,
    congregationId: filters.congregationId || undefined,
    giftId: filters.giftId || undefined,
    attention: filters.attention || undefined,
    sort: query.sort,
    order: query.order,
  });

  const summary = useBelieversSummary(api);
  const { data: congregations = [] } = useCongregations(api);
  const { data: gifts = [] } = useGifts(api);

  const byId = useMemo(() => new Map(congregations.map((one) => [one.id, one])), [congregations]);

  return {
    query,
    filters,
    page: list.data,
    summary: summary.data,
    congregations,
    gifts,
    congregationOf: (id) => (id === null ? undefined : byId.get(id)),
    // El día de quien mira: la sonda del cliente y la del servidor pueden
    // discrepar en el cambio de día, y la del cliente es la que se está viendo.
    today: todayIn(Intl.DateTimeFormat().resolvedOptions().timeZone),
    canManage: can('believers.manage'),
    isLoading: list.isFetching && !list.data,
    isError: list.isError,
    refetch: () => {
      void list.refetch();
    },
  };
}
