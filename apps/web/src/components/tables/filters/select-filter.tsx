import type { CustomTableColumn, RowFilter } from '@navis/shared';

import { OptionChip } from '@/components/tables/row-value-cell';
import { cn } from '@/lib/cn';

/** Selección única y múltiple: las opciones que ya existen en esa columna,
 * como chips que se encienden y apagan (D28) — nunca un texto libre. */
export function SelectFilterControl({
  column,
  label,
  filter,
  onChange,
}: {
  column: CustomTableColumn;
  label: string;
  filter: RowFilter | undefined;
  onChange: (filter: RowFilter | null) => void;
}) {
  const current = Array.isArray(filter?.value) ? (filter.value as string[]) : [];
  const toggle = (value: string) => {
    const next = current.includes(value)
      ? current.filter((one) => one !== value)
      : [...current, value];
    onChange(next.length > 0 ? { columnKey: column.key, operator: 'in', value: next } : null);
  };

  return (
    <fieldset className="gap-2 flex flex-col">
      <legend className="text-sm font-medium text-foreground">{label}</legend>
      <div className="min-h-11 gap-1.5 flex flex-wrap items-center">
        {(column.options ?? []).map((one) => (
          <button
            key={one.value}
            type="button"
            onClick={() => {
              toggle(one.value);
            }}
            aria-pressed={current.includes(one.value)}
            className={cn(
              'cursor-pointer rounded-full transition-opacity',
              !current.includes(one.value) && 'opacity-45 hover:opacity-80',
            )}
          >
            <OptionChip option={one} fallback={one.value} />
          </button>
        ))}
      </div>
    </fieldset>
  );
}
