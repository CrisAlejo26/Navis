import type { CustomTableColumn, RowFilter } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
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
        size="sm"
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

    return (
      <Select
        size="sm"
        multiple
        label={label}
        value={current}
        onChange={(event) => {
          const picked = Array.from(event.target.selectedOptions, (one) => one.value);
          onChange(
            picked.length > 0 ? { columnKey: column.key, operator: 'in', value: picked } : null,
          );
        }}
      >
        {(column.options ?? []).map((one) => (
          <option key={one.value} value={one.value}>
            {one.label}
          </option>
        ))}
      </Select>
    );
  }

  return null;
}
