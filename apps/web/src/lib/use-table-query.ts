import { DEFAULT_PAGE_SIZE, isPageSize, type SortOrder } from '@navis/shared';
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';

export interface TableQuery<TSort extends string> {
  page: number;
  limit: number;
  search: string;
  sort: TSort;
  order: SortOrder;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setSearch: (search: string) => void;
  /** Ordena por esa columna; si ya era la activa, le da la vuelta. */
  toggleSort: (field: TSort) => void;
}

interface Options<TSort extends string> {
  /** Columnas por las que se puede ordenar. Lo que venga de la URL se valida contra esto. */
  fields: readonly TSort[];
  sort: TSort;
  order: SortOrder;
}

/**
 * Los filtros de una tabla, guardados en la URL.
 *
 * Así una búsqueda o una página concreta se pueden compartir y el botón de
 * atrás del navegador hace lo que se espera. Se reemplaza la entrada del
 * historial en vez de apilar una nueva: escribir en el buscador no deja diez
 * pasos atrás.
 *
 * Todo lo que llega de la URL se valida —es texto que escribe cualquiera—, y
 * si no cuadra se cae al valor por defecto.
 */
export function useTableQuery<TSort extends string>(defaults: Options<TSort>): TableQuery<TSort> {
  const [params, setParams] = useSearchParams();

  const update = useCallback(
    (changes: Record<string, string | null>) => {
      setParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          for (const [key, value] of Object.entries(changes)) {
            if (value === null || value === '') next.delete(key);
            else next.set(key, value);
          }
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const page = Math.max(1, Number(params.get('page') ?? 1) || 1);
  const rawLimit = Number(params.get('limit') ?? 0);
  const limit = isPageSize(rawLimit) ? rawLimit : DEFAULT_PAGE_SIZE;
  const search = params.get('search') ?? '';
  const rawSort = params.get('sort');
  const sort = defaults.fields.find((field) => field === rawSort) ?? defaults.sort;
  const order: SortOrder = params.get('order') === 'asc' ? 'asc' : 'desc';

  return useMemo(
    () => ({
      page,
      limit,
      search,
      sort,
      order: params.get('order') ? order : defaults.order,
      setPage: (value: number) => {
        update({ page: String(value) });
      },
      // Cambiar el tamaño de página o la búsqueda vuelve a la primera: la
      // página 7 de los resultados de antes no existe en los de ahora.
      setLimit: (value: number) => {
        update({ limit: String(value), page: null });
      },
      setSearch: (value: string) => {
        update({ search: value, page: null });
      },
      toggleSort: (field: TSort) => {
        const sameColumn = field === sort;
        update({
          sort: field,
          order: sameColumn && order === 'asc' ? 'desc' : 'asc',
          page: null,
        });
      },
    }),
    [page, limit, search, sort, order, params, defaults.order, update],
  );
}
