import { Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

/** Editar y borrar una fila, en fila compacta (tabla) o en botones anchos (ficha). */
export function RowActions({
  compact,
  onEdit,
  onDelete,
}: {
  compact: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();

  if (compact) {
    return (
      <div className="gap-1 flex justify-end">
        <Button variant="ghost" size="icon" aria-label={t('common.edit')} onClick={onEdit}>
          <Pencil size={14} aria-hidden />
        </Button>
        <Button variant="ghost" size="icon" aria-label={t('tables.deleteRow')} onClick={onDelete}>
          <Trash2 size={14} aria-hidden />
        </Button>
      </div>
    );
  }

  return (
    <div className="gap-2 flex">
      <Button variant="secondary" size="sm" className="flex-1" onClick={onEdit}>
        <Pencil size={14} aria-hidden />
        {t('common.edit')}
      </Button>
      <Button variant="ghost" size="sm" onClick={onDelete}>
        <Trash2 size={14} aria-hidden />
      </Button>
    </div>
  );
}
