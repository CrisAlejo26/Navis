import {
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek,
  toIsoDate,
  type RowFilter,
} from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { Chip } from '@/components/ui/chip';
import { Input } from '@/components/ui/input';

type DateRange = { from?: string; to?: string };

/** Los tres atajos que pide D28: hoy, esta semana, este mes. */
function shortcutRange(shortcut: 'today' | 'thisWeek' | 'thisMonth'): DateRange {
  const today = toIsoDate(new Date());
  if (shortcut === 'today') return { from: today, to: today };
  if (shortcut === 'thisWeek') return { from: startOfWeek(today), to: endOfWeek(today) };
  return { from: startOfMonth(today), to: endOfMonth(today) };
}

/** Fecha: un rango desde/hasta, con atajos (D28) — el resto del rango se
 * puede seguir afinando a mano después de pulsar uno. */
export function DateFilterControl({
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
  const range = (filter?.value ?? {}) as DateRange;
  const set = (patch: Partial<DateRange>) => {
    const next = { ...range, ...patch };
    onChange(!next.from && !next.to ? null : { columnKey, operator: 'between', value: next });
  };

  const shortcuts: { key: 'today' | 'thisWeek' | 'thisMonth'; label: string }[] = [
    { key: 'today', label: t('tables.filters.today') },
    { key: 'thisWeek', label: t('tables.filters.thisWeek') },
    { key: 'thisMonth', label: t('tables.filters.thisMonth') },
  ];

  return (
    // `min-w-0` por la misma razón que en el filtro numérico: dos campos de
    // fecha piden su ancho natural y desbordan la columna si no se les deja
    // encoger (CLAUDE.md).
    <div className="gap-1.5 min-w-0 flex flex-col">
      <div className="gap-1.5 min-w-0 flex items-end">
        <div className="min-w-0 flex-1">
          <Input
            type="date"
            label={label}
            value={range.from ?? ''}
            onChange={(event) => {
              set({ from: event.target.value || undefined });
            }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <Input
            type="date"
            aria-label={`${label} · ${t('tables.filters.to')}`}
            value={range.to ?? ''}
            onChange={(event) => {
              set({ to: event.target.value || undefined });
            }}
          />
        </div>
      </div>
      <div className="gap-1.5 flex flex-wrap">
        {shortcuts.map((one) => {
          const target = shortcutRange(one.key);
          const active = range.from === target.from && range.to === target.to;
          return (
            <Chip
              key={one.key}
              active={active}
              onClick={() => {
                set(active ? { from: undefined, to: undefined } : target);
              }}
            >
              {one.label}
            </Chip>
          );
        })}
      </div>
    </div>
  );
}
