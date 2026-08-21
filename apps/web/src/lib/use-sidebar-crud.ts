import { useState } from 'react';

import { useNavBranches, type NavBranchesResult } from '@/lib/nav-branches';
import { usePermissions } from '@/lib/permissions';

export type SidebarKind = 'calendar' | 'list' | 'table';

export interface SidebarEntry {
  kind: SidebarKind;
  id: string;
}

export interface SidebarCrud extends NavBranchesResult {
  creando: SidebarKind | null;
  editando: SidebarEntry | null;
  borrando: SidebarEntry | null;
  abrirAlta: (kind: SidebarKind) => void;
  cerrarFormulario: () => void;
  cerrarBorrado: () => void;
}

/**
 * Alta, edición y borrado de un calendario, una lista o una tabla desde
 * cualquier sitio — hoy solo la barra lateral, pero el estado no sabe nada de
 * eso — sin salir de donde se esté. Aparte de `AppLayout` para que se quede
 * dentro del objetivo de la Regla 6.
 *
 * `onBeforeOpen` existe para cerrar el panel de móvil antes de abrir el
 * diálogo: sin eso, el `Drawer` se queda encima del formulario.
 */
export function useSidebarCrud(onBeforeOpen?: () => void): SidebarCrud {
  const { can } = usePermissions();
  const [creando, setCreando] = useState<SidebarKind | null>(null);
  const [editando, setEditando] = useState<SidebarEntry | null>(null);
  const [borrando, setBorrando] = useState<SidebarEntry | null>(null);

  const abrirAlta = (kind: SidebarKind) => {
    onBeforeOpen?.();
    setCreando(kind);
  };

  const editorFor = (kind: SidebarKind, permission: Parameters<typeof can>[0]) =>
    can(permission) ? (id: string) => setEditando({ kind, id }) : undefined;
  const deleterFor = (kind: SidebarKind, permission: Parameters<typeof can>[0]) =>
    can(permission) ? (id: string) => setBorrando({ kind, id }) : undefined;

  const result = useNavBranches({
    onAddCalendar: can('calendar.manage') ? () => abrirAlta('calendar') : undefined,
    onAddList: can('lists.manage') ? () => abrirAlta('list') : undefined,
    onAddTable: can('tables.manage') ? () => abrirAlta('table') : undefined,
    onEditCalendar: editorFor('calendar', 'calendar.manage'),
    onDeleteCalendar: deleterFor('calendar', 'calendar.manage'),
    onEditList: editorFor('list', 'lists.manage'),
    onDeleteList: deleterFor('list', 'lists.manage'),
    onEditTable: editorFor('table', 'tables.manage'),
    onDeleteTable: deleterFor('table', 'tables.manage'),
  });

  return {
    ...result,
    creando,
    editando,
    borrando,
    abrirAlta,
    cerrarFormulario: () => {
      setCreando(null);
      setEditando(null);
    },
    cerrarBorrado: () => {
      setBorrando(null);
    },
  };
}
