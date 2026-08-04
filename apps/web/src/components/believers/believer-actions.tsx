import { NotebookPen, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

export interface BelieverActionHandlers {
  onNote: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Lo que se le puede hacer a un hermano desde el listado. Lo comparten la fila
 * de la tabla y la ficha, que son la misma acción en dos sitios (§7.4).
 *
 * «Añadir nota» va primero porque es lo que más se pulsa: el resto de la
 * pantalla existe para llegar hasta ahí.
 */
export function BelieverActions({
  name,
  canManage,
  onNote,
  onEdit,
  onDelete,
}: BelieverActionHandlers & { name: string; canManage: boolean }) {
  const { t } = useTranslation();
  if (!canManage) return null;

  const actions = [
    { icon: NotebookPen, label: t('notes.add'), onClick: onNote, danger: false },
    { icon: Pencil, label: t('believers.editPerson'), onClick: onEdit, danger: false },
    // El nombre lo añade `aria-label` abajo: si estuviera también aquí,
    // el lector de pantalla diría «Eliminar a Amir: Amir».
    { icon: Trash2, label: t('common.delete'), onClick: onDelete, danger: true },
  ] as const;

  return (
    <span className="gap-0.5 flex justify-end">
      {actions.map(({ icon: Icon, label, onClick, danger }) => (
        <Button
          key={label}
          variant="ghost"
          size="icon"
          title={label}
          aria-label={`${label}: ${name}`}
          onClick={onClick}
          className={danger ? 'hover:bg-destructive/10 hover:text-destructive' : undefined}
        >
          <Icon size={16} aria-hidden />
        </Button>
      ))}
    </span>
  );
}
