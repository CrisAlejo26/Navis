import type { RowFilter } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { Input } from '@/components/ui/input';

/** Número y moneda: un rango mínimo/máximo (D28), sin más operadores que los
 * que la API acepta (`table-row-filters.ts`, D30). */
export function NumericFilterControl({
  columnKey,
  label,
  filter,
  onChange,
}: {
  columnKey: string;
  label: string;
  filter: RowFilter | undefined;
  onChange: (filter: RowFilter | null) => void;
}) {
  const { t } = useTranslation();
  const range = (filter?.value ?? {}) as { min?: number; max?: number };
  const set = (patch: Partial<typeof range>) => {
    const next = { ...range, ...patch };
    onChange(
      next.min === undefined && next.max === undefined
        ? null
        : { columnKey, operator: 'between', value: next },
    );
  };

  return (
    // `min-w-0` en el contenedor y en cada mitad: sin él, los dos campos
    // piden su ancho natural y desbordan la columna de la rejilla de
    // filtros en vez de encogerse dentro de ella (CLAUDE.md, «un hijo ancho
    // dentro de un flex-col ensancha al padre»).
    <div className="gap-1.5 min-w-0 flex items-end">
      <div className="min-w-0 flex-1">
        <Input
          type="number"
          label={label}
          placeholder={t('tables.filters.min')}
          value={range.min ?? ''}
          onChange={(event) => {
            set({ min: event.target.value === '' ? undefined : Number(event.target.value) });
          }}
        />
      </div>
      <div className="min-w-0 flex-1">
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
    </div>
  );
}
