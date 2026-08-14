import type { CustomTableColumn, RowFilter } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { OptionChip } from '@/components/tables/row-value-cell';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/cn';
import { NUMERIC_TYPES, TEXT_TYPES } from '@/lib/tables/column-types';

/** El control de filtro que le toca a una columna, según su tipo (D28). */
export function ColumnFilterControl({
  column,
  filter,
  label,
  onChange,
}: {
  column: CustomTableColumn;
  filter: RowFilter | undefined;
  label: string;
  onChange: (filter: RowFilter | null) => void;
}) {
  const { t } = useTranslation();

  if (TEXT_TYPES.has(column.type)) {
    return (
      <Input
        label={label}
        placeholder={t('tables.filters.contains')}
        value={typeof filter?.value === 'string' ? filter.value : ''}
        onChange={(event) => {
          const value = event.target.value;
          onChange(value ? { columnKey: column.key, operator: 'contains', value } : null);
        }}
      />
    );
  }

  if (NUMERIC_TYPES.has(column.type)) {
    const range = (filter?.value ?? {}) as { min?: number; max?: number };
    const set = (patch: Partial<typeof range>) => {
      const next = { ...range, ...patch };
      onChange(
        next.min === undefined && next.max === undefined
          ? null
          : { columnKey: column.key, operator: 'between', value: next },
      );
    };

    return (
      <div className="gap-1.5 flex items-end">
        <Input
          type="number"
          label={label}
          placeholder={t('tables.filters.min')}
          value={range.min ?? ''}
          onChange={(event) => {
            set({ min: event.target.value === '' ? undefined : Number(event.target.value) });
          }}
        />
        <Input
          type="number"
          aria-label={`${label} · ${t('tables.filters.max')}`}
          placeholder={t('tables.filters.max')}
          value={range.max ?? ''}
          onChange={(event) => {
            set({ max: event.target.value === '' ? undefined : Number(event.target.value) });
          }}
        />
      </div>
    );
  }

  if (column.type === 'date') {
    const range = (filter?.value ?? {}) as { from?: string; to?: string };
    const set = (patch: Partial<typeof range>) => {
      const next = { ...range, ...patch };
      onChange(
        !next.from && !next.to ? null : { columnKey: column.key, operator: 'between', value: next },
      );
    };

    return (
      <div className="gap-1.5 flex items-end">
        <Input
          type="date"
          label={label}
          value={range.from ?? ''}
          onChange={(event) => {
            set({ from: event.target.value || undefined });
          }}
        />
        <Input
          type="date"
          aria-label={`${label} · ${t('tables.filters.to')}`}
          value={range.to ?? ''}
          onChange={(event) => {
            set({ to: event.target.value || undefined });
          }}
        />
      </div>
    );
  }

  if (column.type === 'checkbox') {
    const current = filter?.value === true ? 'true' : filter?.value === false ? 'false' : '';

    return (
      <Select
        label={label}
        value={current}
        onChange={(event) => {
          const value = event.target.value;
          onChange(
            value ? { columnKey: column.key, operator: 'equals', value: value === 'true' } : null,
          );
        }}
      >
        <option value="">{t('tables.filters.any')}</option>
        <option value="true">{t('common.yes')}</option>
        <option value="false">{t('common.no')}</option>
      </Select>
    );
  }

  if (column.type === 'single_select' || column.type === 'multi_select') {
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

  return null;
}
