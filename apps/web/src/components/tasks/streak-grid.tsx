import type { TaskStreakDay } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/cn';
import { formatDay } from '@/lib/format';

/** La tira de los últimos noventa días, a escala (§9.4): el Faro, en miniatura. */
export function StreakGrid({ days }: { days: TaskStreakDay[] }) {
  const { t } = useTranslation();

  return (
    <div className="gap-1 flex flex-wrap" role="img" aria-label={t('tasks.statsStreakCurrent')}>
      {days.map((day, index) => (
        <span
          key={day.date}
          title={`${formatDay(day.date, 'short')}: ${day.empty ? t('tasks.filterNoDate') : day.completed ? t('tasks.statusDone') : t('tasks.statusPending')}`}
          style={{ animationDelay: `${String(index * 6)}ms` }}
          className={cn(
            'h-2.5 w-2.5 animate-rise-in rounded-[3px]',
            day.empty && 'bg-muted',
            !day.empty && day.completed && 'bg-warning',
            !day.empty && !day.completed && 'bg-muted-foreground/25',
          )}
        />
      ))}
    </div>
  );
}
