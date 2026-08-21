import { useCalendars, useLists, useTables } from '@navis/api-client';
import type { Calendar, CustomTable, List } from '@navis/shared';
import { useMemo } from 'react';

import type { NavBranch } from '@/components/app-nav';
import { api } from '@/lib/api';
import type { NavChildren } from '@/lib/nav';
import { usePermissions } from '@/lib/permissions';

/** Lo que hace falta para editar o borrar una entrada, además de pintarla. */
export interface NavBranchData {
  calendars: readonly Calendar[];
  lists: readonly List[];
  tables: readonly CustomTable[];
}

export interface NavBranchesResult {
  branches: Partial<Record<NavChildren, NavBranch>>;
  data: NavBranchData;
}

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
 * barra sin borrarlas. `data` devuelve las filas enteras, no solo `{to,
 * label}`: es lo que necesita el layout para abrir el formulario de edición
 * o el aviso de borrado sin volver a pedirlas.
 */
export function useNavBranches(actions: {
  onAddCalendar?: () => void;
  onAddList?: () => void;
  onAddTable?: () => void;
  onEditCalendar?: (id: string) => void;
  onDeleteCalendar?: (id: string) => void;
  onEditList?: (id: string) => void;
  onDeleteList?: (id: string) => void;
  onEditTable?: (id: string) => void;
  onDeleteTable?: (id: string) => void;
}): NavBranchesResult {
  const { can } = usePermissions();
  const { data: calendars = [] } = useCalendars(api, can('calendar.view'));
  const { data: lists = [] } = useLists(api, can('lists.view'));
  const { data: tables = [] } = useTables(api, can('tables.view'));
  const activeLists = useMemo(() => lists.filter((one) => one.isActive), [lists]);
  const activeTables = useMemo(() => tables.filter((one) => one.isActive), [tables]);

  const branches = useMemo(
    () => ({
      calendars: {
        entries: calendars.map((one) => ({
          to: `/calendar/${one.slug}`,
          label: one.name,
          id: one.id,
        })),
        onAdd: actions.onAddCalendar,
        addLabelKey: 'calendar.addCalendar',
        onEditEntry: actions.onEditCalendar,
        onDeleteEntry: actions.onDeleteCalendar,
      },
      lists: {
        entries: activeLists.map((one) => ({
          to: `/lists/${one.slug}`,
          label: one.name,
          id: one.id,
        })),
        onAdd: actions.onAddList,
        addLabelKey: 'lists.add',
        onEditEntry: actions.onEditList,
        onDeleteEntry: actions.onDeleteList,
      },
      tables: {
        entries: activeTables.map((one) => ({
          to: `/tables/${one.slug}`,
          label: one.name,
          id: one.id,
        })),
        onAdd: actions.onAddTable,
        addLabelKey: 'tables.newTable',
        onEditEntry: actions.onEditTable,
        onDeleteEntry: actions.onDeleteTable,
      },
    }),
    [
      calendars,
      activeLists,
      activeTables,
      actions.onAddCalendar,
      actions.onAddList,
      actions.onAddTable,
      actions.onEditCalendar,
      actions.onDeleteCalendar,
      actions.onEditList,
      actions.onDeleteList,
      actions.onEditTable,
      actions.onDeleteTable,
    ],
  );

  return { branches, data: { calendars, lists, tables } };
}
