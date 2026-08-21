import type { ListDetail } from '@navis/api-client';
import { useNavigate } from 'react-router';

import { AddMembersDialog } from '@/components/lists/add-members-dialog';
import { DeleteListDialog } from '@/components/lists/delete-list-dialog';
import { ListExportDialog } from '@/components/lists/list-export-dialog';
import { ListForm } from '@/components/lists/list-form';

/** Cuál está abierto, si alguno. Uno cada vez: son todos modales. */
export type ListDialog = 'members' | 'edit' | 'export' | 'delete' | null;

/**
 * Los cuatro diálogos de la ficha de una lista, juntos.
 *
 * Están fuera de la ruta porque son otra responsabilidad: allí se decide qué
 * pestaña se ve y aquí qué ventana está abierta (Regla 6 §2). Y borrar vive
 * aquí con su confirmación, que dice **qué pasa** antes de que pase: se
 * despublica, se cortan las sesiones y los accesos pierden esta lista.
 */
export function ListDialogs({
  list,
  churchName,
  open,
  onClose,
}: {
  list: ListDetail;
  churchName: string;
  open: ListDialog;
  onClose: () => void;
}) {
  const navigate = useNavigate();

  return (
    <>
      <AddMembersDialog
        open={open === 'members'}
        onClose={onClose}
        listId={list.id}
        already={new Set(list.members.map((one) => one.believerId))}
      />

      <ListForm open={open === 'edit'} onClose={onClose} list={list} />

      <ListExportDialog
        open={open === 'export'}
        onClose={onClose}
        list={list}
        churchName={churchName}
      />

      <DeleteListDialog
        list={open === 'delete' ? list : null}
        onClose={onClose}
        onDeleted={() => {
          void navigate('/lists');
        }}
      />
    </>
  );
}
