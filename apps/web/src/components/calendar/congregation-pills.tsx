import type { Congregation } from '@navis/shared';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Chip } from '@/components/ui/chip';
import { ACCENT_RAIL, accentVars } from '@/lib/calendar/accents';
import { cn } from '@/lib/cn';

/**
 * El filtro de sedes. **Solo aparece cuando hay más de una** (RFC 0002 D12):
 * con una sola, la palabra «sede» no tiene por qué existir para quien la usa.
 */
export function CongregationPills({
  congregations,
  selected,
  onToggle,
  onClear,
  onAdd,
}: {
  congregations: readonly Congregation[];
  selected: readonly string[];
  onToggle: (id: string) => void;
  onClear: () => void;
  /** Alta rápida, solo para quien puede programar. */
  onAdd?: () => void;
}) {
  const { t } = useTranslation();
  if (congregations.length < 2) return null;

  return (
    <div className="gap-1.5 flex flex-wrap items-center">
      <Chip active={selected.length === 0} onClick={onClear}>
        {t('calendar.allCongregations')}
      </Chip>

      {congregations.map((congregation) => {
        const active = selected.includes(congregation.id);

        return (
          <Chip
            key={congregation.id}
            active={active}
            onClick={() => {
              onToggle(congregation.id);
            }}
          >
            <span
              aria-hidden
              style={accentVars(congregation.accent)}
              className={cn('h-2 w-2 rounded-full', ACCENT_RAIL)}
            />
            {congregation.name}
          </Chip>
        );
      })}

      {onAdd && (
        <button
          type="button"
          onClick={onAdd}
          aria-label={t('calendar.addCongregation')}
          className="h-7 w-7 inline-flex cursor-pointer items-center justify-center rounded-full border border-dashed text-muted-foreground hover:border-solid hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <Plus size={13} aria-hidden />
        </button>
      )}
    </div>
  );
}
