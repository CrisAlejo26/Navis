import type { TaskStreakDay } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/cn';
import { formatDay } from '@/lib/format';

/**
 * La tira de los últimos días, bajo el Faro (§9.1, D19): calcada de
 * `NightsStrip` (sueños) — un punto por día, lleno si se cumplió, hueco si
 * no— y con su misma entrada escalonada.
 */
export function StreakStrip({ days }: { days: TaskStreakDay[] }) {
  const { t } = useTranslation();

  return (
    <ul className="gap-1.5 sm:gap-2 flex items-center justify-center">
      {days.map((day, index) => {
        const label = day.empty
          ? t('tasks.filterNoDate')
          : day.completed
            ? t('tasks.statusDone')
            : t('tasks.statusPending');

        return (
          <li
            key={day.date}
            style={{ animationDelay: `${String(index * 35)}ms` }}
            className="animate-rise-in"
          >
            <span
              className={cn(
                'h-2.5 w-2.5 block rounded-full border transition-colors',
                day.empty && 'border-border bg-transparent',
                !day.empty && day.completed && 'border-warning bg-warning',
                !day.empty && !day.completed && 'border-muted-foreground/40 bg-transparent',
              )}
              aria-hidden
            />
            <span className="sr-only">
              {formatDay(day.date, 'short')}: {label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
