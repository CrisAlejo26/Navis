import {
  useBelievers,
  useBelieversSummary,
  useCongregations,
  useGifts,
  useListMemberships,
  useLists,
  useMinistries,
} from '@navis/api-client';
import {
  BELIEVER_SORT_FIELDS,
  DEFAULT_BELIEVER_SORT,
  todayIn,
  type BelieverListItem,
  type Congregation,
  type Gift,
  type MinistryCatalog,
  type IsoDate,
  type ListMemberships,
  type ListSummary,
  type Paginated,
  type BelieversSummary,
} from '@navis/shared';
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
  /** El catálogo de labores, para resolver a nombre y color los slugs de cada fila. */
  ministries: MinistryCatalog[];
  /**
   * Las listas de la iglesia y en cuáles está cada persona (RFC 0010 §8.7).
   *
   * Salen de **una sola llamada por iglesia** que se cachea, y no de un `join`
   * dentro del listado paginado: con relaciones cargadas, `take`/`skip` de
   * TypeORM se van a una subconsulta con `DISTINCT` (CLAUDE.md).
   */
  lists: ListSummary[];
  memberships: ListMemberships;
  today: IsoDate;
  canManage: boolean;
  /** Meter a alguien en una lista es otro permiso: es de listas, no de fichas. */
  canManageLists: boolean;
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
    listId: filters.listId || undefined,
    inLists: filters.inLists || undefined,
    attention: filters.attention || undefined,
    sort: query.sort,
    order: query.order,
  });

  const summary = useBelieversSummary(api);
  const { data: congregations = [] } = useCongregations(api);
  const { data: gifts = [] } = useGifts(api);
  const { data: ministries = [] } = useMinistries(api);
  // Los nombres de las listas también son información: sin `lists.view` no se
  // piden ni se pintan los puntos (§7.1).
  const puedeVerListas = can('lists.view');
  const { data: lists = [] } = useLists(api, puedeVerListas);
  const { data: memberships = {} } = useListMemberships(api, puedeVerListas);

  return {
    query,
    filters,
    page: list.data,
    summary: summary.data,
    congregations,
    gifts,
    ministries,
    lists,
    memberships,
    // El día de quien mira: la sonda del cliente y la del servidor pueden
    // discrepar en el cambio de día, y la del cliente es la que se está viendo.
    today: todayIn(Intl.DateTimeFormat().resolvedOptions().timeZone),
    canManage: can('believers.manage'),
    canManageLists: can('lists.manage'),
    isLoading: list.isFetching && !list.data,
    isError: list.isError,
    refetch: () => {
      void list.refetch();
    },
  };
}
