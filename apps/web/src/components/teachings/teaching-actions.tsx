import { Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

export interface TeachingActionHandlers {
  onEdit: () => void;
  onDelete: () => void;
}

/** Lo que se le puede hacer a una enseñanza. Lo comparten la fila y la ficha. */
export function TeachingActions({
  title,
  onEdit,
  onDelete,
}: TeachingActionHandlers & { title?: string }) {
  const { t } = useTranslation();

  const actions = [
    { icon: Pencil, label: t('teachings.edit'), onClick: onEdit, danger: false },
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
