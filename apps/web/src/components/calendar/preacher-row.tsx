import type { Preacher } from '@navis/shared';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { formatDay } from '@/lib/format';
import { cn } from '@/lib/cn';

/**
 * Un candidato, con lo único que hace falta para decidir: cuándo subió por
 * última vez y cuántas veces lleva en el tramo. Quien no ha subido nunca lo
 * dice con todas las letras, que es la información más útil de la lista.
 */
export function PreacherRow({
  preacher,
  selected,
  congregationName,
  onPick,
}: {
  preacher: Preacher;
  selected: boolean;
  congregationName?: string;
  onPick: (preacher: Preacher) => void;
}) {
  const { t } = useTranslation();

  return (
    <li>
      <button
        type="button"
        onClick={() => {
          onPick(preacher);
        }}
        className={cn(
          'gap-3 px-3 py-2.5 flex w-full cursor-pointer items-center rounded-lg text-left',
          'transition-colors duration-150 hover:bg-muted',
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
          selected && 'bg-muted',
        )}
      >
        <span className="min-w-0 flex-1">
          <span className="gap-2 flex items-baseline">
            <span className="font-medium truncate">{preacher.name}</span>
            {congregationName && (
              <span className="text-[11px] text-muted-foreground">{congregationName}</span>
            )}
          </span>
          <span className="mt-0.5 gap-2 flex text-[11px] text-muted-foreground">
            <span>
              {preacher.lastDate
                ? t('calendar.lastTime', { date: formatDay(preacher.lastDate, 'short') })
                : t('calendar.never')}
            </span>
            <span aria-hidden>·</span>
            <span>{t('calendar.timesInRange', { count: preacher.timesInRange })}</span>
          </span>
        </span>

        {selected && <Check size={16} aria-hidden className="text-primary" />}
      </button>
    </li>
  );
}
