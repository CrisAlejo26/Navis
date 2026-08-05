import { useDreams, useEmotions } from '@navis/api-client';
import {
  DEFAULT_DREAM_SORT,
  DREAM_SORT_FIELDS,
  todayIn,
  type DreamListItem,
  type EmotionWithCount,
  type IsoDate,
  type Paginated,
} from '@navis/shared';
import { api } from '@/lib/api';
import { useDreamFilters, type DreamFilters } from '@/lib/dreams/filters';
import { useTableQuery, type TableQuery } from '@/lib/use-table-query';

export interface DreamsScreen {
  query: TableQuery<(typeof DREAM_SORT_FIELDS)[number]>;
  filters: DreamFilters;
  page: Paginated<DreamListItem> | undefined;
  /** El vocabulario, para pintar las pastillas del filtro con su color. */
  emotions: EmotionWithCount[];
  today: IsoDate;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

/**
 * Todo lo que necesita el listado de sueños, en un sitio.
 *
 * Se separa de la vista porque son dos cosas distintas: aquí están la consulta,
 * los filtros de la URL y el día de hoy; en el componente, cómo se pinta
 * (Regla 6 §2). No hay permisos que mirar: quien entra ve los suyos y solo los
 * suyos (RFC 0005 D1, D2).
 */
export function useDreamsScreen(): DreamsScreen {
  const query = useTableQuery({
    fields: DREAM_SORT_FIELDS,
    sort: DEFAULT_DREAM_SORT,
    order: 'desc',
  });
  // El tramo vive en los filtros, que es de donde lo leen también los campos
  // de fecha: la franja enlaza a una noche concreta con `from` y `to` iguales.
  const filters = useDreamFilters();
  const from = filters.from || undefined;
  const to = filters.to || undefined;

  const list = useDreams(api, {
    page: query.page,
    limit: query.limit,
    search: query.search || undefined,
    state: filters.state,
    emotion: filters.emotion,
    from,
    to,
    sort: query.sort,
    order: query.order,
  });

  const emotions = useEmotions(api);

  return {
    query,
    filters,
    page: list.data,
    emotions: emotions.data ?? [],
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
