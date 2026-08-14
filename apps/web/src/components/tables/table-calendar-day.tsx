import type { CustomTableColumn, CustomTableRow } from '@navis/shared';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { RowValueCell } from '@/components/tables/row-value-cell';
import { cn } from '@/lib/cn';

const MAX_VISIBLE = 3;

/** Un día de la vista de calendario: hasta tres filas, y «y N más» si hay más. */
export function TableCalendarDay({
  date,
  outside,
  isToday,
  rows,
  titleColumn,
  editable,
  onOpenRow,
  onAddRow,
}: {
  date: string;
  outside: boolean;
  isToday: boolean;
  rows: readonly CustomTableRow[];
  titleColumn: CustomTableColumn | undefined;
  editable: boolean;
  onOpenRow: (row: CustomTableRow) => void;
  onAddRow: (date: string) => void;
}) {
  const { t } = useTranslation();
  const visibles = rows.slice(0, MAX_VISIBLE);
  const resto = rows.length - visibles.length;

  return (
    <div
      className={cn(
        'p-1.5 gap-1 min-h-24 flex flex-col border-r border-b bg-card last:border-r-0',
        outside && 'bg-muted/30 text-muted-foreground',
      )}
    >
      <div className="gap-1 flex items-center justify-between">
        <span
          className={cn(
            'h-5 w-5 text-xs flex items-center justify-center rounded-full tabular-nums',
            isToday && 'font-semibold bg-primary text-primary-foreground',
          )}
        >
          {Number(date.slice(8, 10))}
        </span>

        {editable && (
          <button
            type="button"
            aria-label={t('tables.newRow')}
            onClick={() => {
              onAddRow(date);
            }}
            className="h-5 w-5 rounded flex cursor-pointer items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Plus size={13} aria-hidden />
          </button>
        )}
      </div>

      <div className="gap-1 flex flex-1 flex-col overflow-hidden">
        {visibles.map((row) => (
          <button
            key={row.id}
            type="button"
            onClick={() => {
              onOpenRow(row);
            }}
            className="px-1.5 py-1 text-xs rounded truncate bg-primary/10 text-left text-primary hover:bg-primary/20"
          >
            {titleColumn ? (
              <RowValueCell column={titleColumn} value={row.data[titleColumn.key]} />
            ) : (
              row.id
            )}
          </button>
        ))}
        {resto > 0 && (
          <span className="px-1.5 text-[11px] text-muted-foreground">
            {t('tables.andMore', { count: resto })}
          </span>
        )}
      </div>
    </div>
  );
}
