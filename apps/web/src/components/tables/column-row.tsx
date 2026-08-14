import type { CustomTableColumn } from '@navis/shared';
import { GripVertical, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { COLUMN_TYPE_ICON, COLUMN_TYPE_LABEL_KEY } from '@/lib/tables/column-types';
import { cn } from '@/lib/cn';

/**
 * Una fila del diálogo de columnas: arrastrable, como los miembros de una
 * lista (RFC 0010 D6), con las flechas de teclado porque arrastrar no basta
 * por sí solo.
 */
export function ColumnRow({
  column,
  index,
  total,
  dragging,
  onDragStart,
  onDragOver,
  onDrop,
  onMove,
  onEdit,
  onDelete,
}: {
  column: CustomTableColumn;
  index: number;
  total: number;
  dragging: boolean;
  onDragStart: () => void;
  onDragOver: () => void;
  onDrop: () => void;
  onMove: (from: number, to: number) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const Icon = COLUMN_TYPE_ICON[column.type];

  return (
    <li
      draggable
      onDragStart={onDragStart}
      onDragOver={(event) => {
        event.preventDefault();
        onDragOver();
      }}
      onDrop={onDrop}
      className={cn(
        'px-2 py-2 gap-2 flex items-center rounded-lg border-b last:border-b-0',
        dragging && 'opacity-40',
      )}
    >
      <GripVertical size={16} aria-hidden className="shrink-0 cursor-grab text-muted-foreground" />

      <div className="gap-1 sm:flex hidden">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t('tables.moveUp')}
          disabled={index === 0}
          onClick={() => {
            onMove(index, index - 1);
          }}
        >
          ↑
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t('tables.moveDown')}
          disabled={index === total - 1}
          onClick={() => {
            onMove(index, index + 1);
          }}
        >
          ↓
        </Button>
      </div>

      <Icon size={16} aria-hidden className="shrink-0 text-muted-foreground" />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{column.label}</p>
        <p className="text-xs text-muted-foreground">{t(COLUMN_TYPE_LABEL_KEY[column.type])}</p>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={t('common.edit')}
        onClick={onEdit}
      >
        <Pencil size={14} aria-hidden />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={t('tables.deleteColumn')}
        onClick={onDelete}
      >
        <Trash2 size={14} aria-hidden />
      </Button>
    </li>
  );
}
