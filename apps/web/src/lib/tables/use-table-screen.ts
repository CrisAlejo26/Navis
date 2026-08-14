import { useTable, useTableViews, useTables } from '@navis/api-client';
import type { CustomTableView, CustomTableWithColumns } from '@navis/shared';
import { useParams } from 'react-router';

import { api } from '@/lib/api';

/**
 * Lo que necesita la ficha de una tabla: cuál es, sus columnas y sus vistas
 * (RFC 0021, «Interfaz»).
 *
 * La tabla se busca **por `slug`** dentro del tablón, ya en caché —igual que
 * una lista (RFC 0010)—, así que abrir una tabla no pide dos veces lo mismo.
 */
export function useTableScreen(): {
  table: CustomTableWithColumns | undefined;
  tableId: string;
  isLoading: boolean;
  notFound: boolean;
} {
  const { slug = '' } = useParams();
  const { data: tables, isLoading: cargandoTablon } = useTables(api);

  const found = tables?.find((one) => one.slug === slug);
  const { data: table, isLoading: cargandoFicha } = useTable(api, found?.id ?? '', Boolean(found));

  return {
    table,
    tableId: found?.id ?? '',
    isLoading: cargandoTablon || (Boolean(found) && cargandoFicha),
    notFound: !cargandoTablon && !found,
  };
}

/** Las vistas guardadas de la tabla (D24): tablero y calendario, si los hay. */
export function useTableViewTabs(tableId: string): CustomTableView[] {
  const { data: saved = [] } = useTableViews(api, tableId, Boolean(tableId));
  return saved;
}
