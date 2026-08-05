import { Anchor, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

export interface ProphecyActionHandlers {
  onEdit: () => void;
  onFulfill: () => void;
  onDelete: () => void;
}

/**
 * Lo que se le puede hacer a una profecía desde el listado. Lo comparten la
 * fila de la tabla y la ficha, que son la misma acción en dos sitios (§7.5).
 *
 * «Anotar un cumplimiento» va primero porque es lo que más se pulsa: una
 * profecía se escribe una vez y se va cumpliendo durante años.
 */
export function ProphecyActions({
  title,
  onEdit,
  onFulfill,
  onDelete,
}: ProphecyActionHandlers & { title?: string }) {
  const { t } = useTranslation();

  const actions = [
    { icon: Anchor, label: t('prophecies.addFulfillment'), onClick: onFulfill, danger: false },
    { icon: Pencil, label: t('prophecies.edit'), onClick: onEdit, danger: false },
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
          aria-label={title ? `${label}: ${title}` : label}
          onClick={onClick}
          className={danger ? 'hover:bg-destructive/10 hover:text-destructive' : undefined}
        >
          <Icon size={16} aria-hidden />
        </Button>
      ))}
    </span>
  );
}
