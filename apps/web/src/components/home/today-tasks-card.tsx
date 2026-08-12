import type { DashboardTask } from '@navis/shared';
import { CheckCircle2, Flame } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { TileHeader } from '@/components/home/tile-header';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { accentVars } from '@/lib/accents';
import { cn } from '@/lib/cn';
import { ACCENT_TONE } from '@/lib/stat-tones';

/**
 * Las tareas de hoy, en la página de inicio (RFC 0018 §9.7).
 *
 * El número de la racha va en una esquina, sin el bucle del Faro: aquí
 * acompaña, no compite con el calendario semanal que ya es lo que se viene a
 * mirar en esta pantalla (D19).
 */
export function TodayTasksCard({
  tasks,
  streak,
  className,
}: {
  tasks: readonly DashboardTask[];
  streak: number;
  className?: string;
}) {
  const { t } = useTranslation();

  return (
    <Card
      className={cn('p-0 gap-0 flex flex-col overflow-hidden', ACCENT_TONE.warning.edge, className)}
    >
      <div className="p-5 pb-3 flex items-center justify-between">
        <TileHeader icon={CheckCircle2} label={t('tasks.today')} tone="warning" />
        {streak > 0 && (
          <span className="gap-1 px-2 py-1 text-xs font-semibold flex items-center rounded-full bg-warning/12 text-warning">
            <Flame size={12} aria-hidden />
            {t('tasks.streakDays', { count: streak })}
          </span>
        )}
      </div>

      {tasks.length === 0 ? (
        <EmptyState icon={CheckCircle2} title={t('tasks.emptyToday')} />
      ) : (
        <ul className="divide-y">
          {tasks.map((task) => (
            <li
              key={task.taskId}
              style={accentVars(task.accent)}
              className="px-5 py-2.5 pl-4 border-l-[3px] border-l-[var(--acento)]"
            >
              <p
                className={cn(
                  'text-sm font-medium',
                  task.completed && 'text-muted-foreground line-through',
                )}
              >
                {task.title}
              </p>
              {task.time && <p className="text-xs text-muted-foreground">{task.time}</p>}
            </li>
          ))}
        </ul>
      )}

      <Link
        to="/tasks"
        className="p-5 pt-3 text-xs font-medium mt-auto text-primary underline-offset-4 hover:underline"
      >
        {t('tasks.title')} →
      </Link>
    </Card>
  );
}
