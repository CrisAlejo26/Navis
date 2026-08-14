import type { CustomTable } from '@navis/shared';
import { Columns3, Download, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { TASK_ICON_MAP } from '@/lib/tasks/icon-map';
import { Button } from '@/components/ui/button';
import { accentVars } from '@/lib/accents';

/**
 * La cabecera de la ficha, a sangre en el color de la tabla (RFC 0021 D32):
 * mismo criterio que la cabecera de una lista, con el icono grande delante.
 */
export function TableHeader({
  table,
  editable,
  onEdit,
  onDelete,
  onColumns,
  onExport,
}: {
  table: CustomTable;
  editable: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onColumns: () => void;
  onExport: () => void;
}) {
  const { t } = useTranslation();
  const Icon = TASK_ICON_MAP[table.icon];

  return (
    <header
      style={accentVars(table.accent)}
      className="px-4 py-8 md:px-8 md:py-10 gap-5 -mx-4 -mt-4 md:-mx-8 md:-mt-8 flex flex-wrap items-end justify-between bg-[var(--acento)] text-[var(--acento-fg)]"
    >
      <div className="gap-3 min-w-0 flex items-center">
        <div className="h-12 w-12 flex shrink-0 items-center justify-center rounded-xl bg-[var(--acento-fg)]/15">
          {Icon && <Icon size={24} aria-hidden />}
        </div>
        <h1 className="text-3xl md:text-4xl font-semibold truncate tracking-[-0.03em]">
          {table.name}
        </h1>
      </div>

      <div className="gap-2 flex flex-wrap">
        <Button
          variant="ghost"
          onClick={onExport}
          className="text-[var(--acento-fg)] hover:bg-[var(--acento-fg)]/15"
        >
          <Download size={15} aria-hidden />
          {t('export.title')}
        </Button>

        {editable && (
          <>
            <Button
              variant="ghost"
              onClick={onColumns}
              className="text-[var(--acento-fg)] hover:bg-[var(--acento-fg)]/15"
            >
              <Columns3 size={15} aria-hidden />
              {t('tables.columns')}
            </Button>
            <Button
              variant="ghost"
              onClick={onEdit}
              className="text-[var(--acento-fg)] hover:bg-[var(--acento-fg)]/15"
            >
              <Pencil size={15} aria-hidden />
              {t('common.edit')}
            </Button>
            <Button
              variant="ghost"
              onClick={onDelete}
              aria-label={t('tables.delete')}
              className="text-[var(--acento-fg)] hover:bg-[var(--acento-fg)]/15"
            >
              <Trash2 size={15} aria-hidden />
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
