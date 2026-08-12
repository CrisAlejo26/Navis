import { useSetHabitOccurrence, useSetTaskOccurrence } from '@navis/api-client';
import type { HabitOccurrence, TaskOccurrence } from '@navis/shared';
import { CalendarCheck, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Faro } from '@/components/tasks/faro';
import { HabitForm } from '@/components/tasks/habit-form';
import { OccurrenceCard } from '@/components/tasks/occurrence-card';
import { OccurrenceDetailDialog } from '@/components/tasks/occurrence-detail-dialog';
import { StreakStrip } from '@/components/tasks/streak-strip';
import { TaskForm } from '@/components/tasks/task-form';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatDay } from '@/lib/format';
import { useTodayScreen, type QuickFilter } from '@/lib/tasks/use-today-screen';

const QUICK_FILTERS: { key: QuickFilter; labelKey: string }[] = [
  { key: 'pending', labelKey: 'tasks.filterPending' },
  { key: 'done', labelKey: 'tasks.filterDone' },
  { key: 'morning', labelKey: 'tasks.filterMorning' },
  { key: 'afternoon', labelKey: 'tasks.filterAfternoon' },
  { key: 'evening', labelKey: 'tasks.filterEvening' },
];

type Selected =
  { kind: 'task'; item: TaskOccurrence } | { kind: 'habit'; item: HabitOccurrence } | null;

/** «Hoy»: la portada del día, con el Faro (RFC 0018 §9.3). */
export function TasksPage() {
  const { t } = useTranslation();
  const screen = useTodayScreen();
  const setTaskStatus = useSetTaskOccurrence(api);
  const setHabitStatus = useSetHabitOccurrence(api);

  const [selected, setSelected] = useState<Selected>(null);
  const [creating, setCreating] = useState<'task' | 'habit' | null>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLElement &&
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)
      ) {
        return;
      }
      if (event.key === 'ArrowLeft') screen.goPreviousDay();
      if (event.key === 'ArrowRight') screen.goNextDay();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo hace falta que exista, no reengancharse en cada render
  }, [screen.date]);

  const isFuture = screen.date > screen.today;
  const items = screen.tab === 'tasks' ? screen.tasks : screen.habits;
  const hasAny = screen.tab === 'tasks' ? screen.hasAnyTask : screen.hasAnyHabit;
  const emptyTitleKey = hasAny
    ? screen.tab === 'tasks'
      ? 'tasks.emptyTasks'
      : 'tasks.emptyHabits'
    : 'tasks.emptyToday';

  return (
    <section className="gap-6 animate-page-in pb-24 sm:pb-6 flex flex-col">
      <header className="gap-4 sm:flex-row sm:justify-between sm:text-left flex flex-col items-center text-center">
        <div className="gap-2 flex items-center">
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('tasks.previousDay')}
            onClick={screen.goPreviousDay}
          >
            <ChevronLeft size={18} aria-hidden />
          </Button>
          <h1 className="text-lg font-semibold min-w-[9rem] capitalize">
            {formatDay(screen.date, 'medium')}
          </h1>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('tasks.nextDay')}
            onClick={screen.goNextDay}
          >
            <ChevronRight size={18} aria-hidden />
          </Button>
        </div>

        {screen.date !== screen.today && (
          <Button variant="secondary" size="sm" onClick={screen.goToday}>
            {t('tasks.today')}
          </Button>
        )}
      </header>

      {screen.tab === 'tasks' && (
        <div className="gap-3 flex flex-col items-center">
          <Faro days={screen.streak?.current ?? 0} dimmed={isFuture} />
          <StreakStrip days={screen.strip14} />
        </div>
      )}

      <div role="tablist" className="gap-1 p-1 flex self-center rounded-full border bg-muted/40">
        {(['tasks', 'habits'] as const).map((tab) => (
          <button
            key={tab}
            role="tab"
            type="button"
            aria-selected={screen.tab === tab}
            onClick={() => {
              screen.setTab(tab);
            }}
            className={cn(
              'px-4 h-9 text-sm font-medium cursor-pointer rounded-full transition-colors',
              screen.tab === tab
                ? 'shadow-sm bg-card'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t(tab === 'tasks' ? 'tasks.tasksTab' : 'tasks.habitsTab')}
          </button>
        ))}
      </div>

      <div className="gap-2 -mx-1 px-1 flex flex-wrap justify-center">
        {QUICK_FILTERS.map((filter) => (
          <button
            key={filter.key}
            type="button"
            onClick={() => {
              screen.toggleQuick(filter.key);
            }}
            aria-pressed={screen.quick.has(filter.key)}
            className={cn(
              'px-3 h-8 text-xs font-medium cursor-pointer rounded-full border transition-colors',
              screen.quick.has(filter.key)
                ? 'border-primary bg-primary text-primary-foreground'
                : 'hover:bg-muted',
            )}
          >
            {t(filter.labelKey)}
          </button>
        ))}
      </div>

      {screen.isLoading ? (
        <PageSkeleton />
      ) : items.length === 0 ? (
        <EmptyState icon={CalendarCheck} title={t(emptyTitleKey)}>
          {!hasAny && t('tasks.emptyTodayHint')}
        </EmptyState>
      ) : (
        <ul className="gap-2 max-w-xl mx-auto flex w-full flex-col">
          {screen.tab === 'tasks'
            ? screen.tasks.map((item, index) => (
                <OccurrenceCard
                  key={item.taskId}
                  index={index}
                  title={item.title}
                  time={item.time}
                  tags={item.tags}
                  completed={item.status === 'completada'}
                  priority={item.priority}
                  hasReminder={item.reminder?.enabled ?? false}
                  isPending={setTaskStatus.isPending}
                  onOpen={() => {
                    setSelected({ kind: 'task', item });
                  }}
                  onToggle={() => {
                    void setTaskStatus.mutateAsync({
                      taskId: item.taskId,
                      date: item.date,
                      status: item.status === 'completada' ? 'pendiente' : 'completada',
                    });
                  }}
                />
              ))
            : screen.habits.map((item, index) => (
                <OccurrenceCard
                  key={item.habitId}
                  index={index}
                  title={item.title}
                  time={item.time}
                  tags={item.tags}
                  completed={item.status === 'completada'}
                  hasReminder={item.reminder?.enabled ?? false}
                  isPending={setHabitStatus.isPending}
                  onOpen={() => {
                    setSelected({ kind: 'habit', item });
                  }}
                  onToggle={() => {
                    void setHabitStatus.mutateAsync({
                      habitId: item.habitId,
                      date: item.date,
                      status: item.status === 'completada' ? 'pendiente' : 'completada',
                    });
                  }}
                />
              ))}
        </ul>
      )}

      {/* La acción principal, al alcance del pulgar (Regla 5 §4). */}
      <Button
        size="lg"
        onClick={() => {
          setCreating(screen.tab === 'tasks' ? 'task' : 'habit');
        }}
        className="right-4 bottom-4 shadow-lg sm:static sm:mx-auto sm:w-auto fixed z-10"
      >
        <Plus size={18} aria-hidden />
        {t(screen.tab === 'tasks' ? 'tasks.add' : 'tasks.addHabit')}
      </Button>

      {selected && (
        <OccurrenceDetailDialog
          occurrence={selected}
          onClose={() => {
            setSelected(null);
          }}
        />
      )}

      <TaskForm
        open={creating === 'task'}
        onClose={() => {
          setCreating(null);
        }}
        defaultDate={screen.date}
      />
      <HabitForm
        open={creating === 'habit'}
        onClose={() => {
          setCreating(null);
        }}
        defaultDate={screen.date}
      />
    </section>
  );
}
