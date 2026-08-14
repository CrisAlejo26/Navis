import { useCalendars, useLists, useTables } from '@navis/api-client';
import { useMemo } from 'react';

import type { NavBranch } from '@/components/app-nav';
import { api } from '@/lib/api';
import type { NavChildren } from '@/lib/nav';
import { usePermissions } from '@/lib/permissions';

/**
 * Las subentradas de la barra lateral: los calendarios, las listas y las
 * tablas.
 *
 * Vienen de la API porque cada iglesia tiene las suyas y se pueden renombrar
 * (RFC 0002 D15, RFC 0010 D3, RFC 0021 D2). Están aquí y no en el layout
 * porque son consultas con su caché y su permiso, y el layout solo tiene que
 * pintarlas.
 *
 * Las listas y las tablas **apagadas no salen**: `is_active` las quita de la
 * barra sin borrarlas.
 */
export function useNavBranches(actions: {
  onAddCalendar?: () => void;
  onAddList?: () => void;
  onAddTable?: () => void;
}): Partial<Record<NavChildren, NavBranch>> {
  const { can } = usePermissions();
  const { data: calendars = [] } = useCalendars(api, can('calendar.view'));
  const { data: lists = [] } = useLists(api, can('lists.view'));
  const { data: tables = [] } = useTables(api, can('tables.view'));

  return useMemo(
    () => ({
      calendars: {
        entries: calendars.map((one) => ({ to: `/calendar/${one.slug}`, label: one.name })),
        onAdd: actions.onAddCalendar,
        addLabelKey: 'calendar.addCalendar',
      },
      lists: {
        entries: lists
          .filter((one) => one.isActive)
          .map((one) => ({ to: `/lists/${one.slug}`, label: one.name })),
        onAdd: actions.onAddList,
        addLabelKey: 'lists.add',
      },
      tables: {
        entries: tables
          .filter((one) => one.isActive)
          .map((one) => ({ to: `/tables/${one.slug}`, label: one.name })),
        onAdd: actions.onAddTable,
        addLabelKey: 'tables.newTable',
      },
    }),
    [calendars, lists, tables, actions.onAddCalendar, actions.onAddList, actions.onAddTable],
  );
}
