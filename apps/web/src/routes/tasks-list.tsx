import { useSetHabitOccurrence, useSetTaskOccurrence } from '@navis/api-client';
import { todayIn } from '@navis/shared';
import { CalendarDays, ListTodo, Plus, Table2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { HabitForm } from '@/components/tasks/habit-form';
import { ListCalendarView } from '@/components/tasks/list-calendar-view';
import { ListToolbar } from '@/components/tasks/list-toolbar';
import { OccurrenceCard } from '@/components/tasks/occurrence-card';
import { OccurrenceDetailDialog } from '@/components/tasks/occurrence-detail-dialog';
import { TaskForm } from '@/components/tasks/task-form';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import { groupItems, itemFields, useListScreen, type ListItem } from '@/lib/tasks/use-list-screen';

/** «Listado» (RFC 0018 §9.5): calendario o lista, con filtros avanzados en la URL. */
export function TasksListPage() {
  const { t } = useTranslation();
  const screen = useListScreen();
  const setTaskStatus = useSetTaskOccurrence(api);
  const setHabitStatus = useSetHabitOccurrence(api);
  const [selected, setSelected] = useState<ListItem | null>(null);
  const [creating, setCreating] = useState<'task' | 'habit' | null>(null);
  const today = todayIn(Intl.DateTimeFormat().resolvedOptions().timeZone);

  const toggle = (item: ListItem) => {
    const fields = itemFields(item);
    const status = fields.status === 'completada' ? 'pendiente' : 'completada';
    if (item.kind === 'task') {
      void setTaskStatus.mutateAsync({ taskId: item.occurrence.taskId, date: fields.date, status });
    } else {
      void setHabitStatus.mutateAsync({
        habitId: item.occurrence.habitId,
        date: fields.date,
        status,
      });
    }
  };

  return (
    <section className="gap-5 animate-page-in pb-24 sm:pb-6 flex flex-col">
      <header className="gap-3 flex flex-wrap items-center justify-between">
        <h1 className="text-lg font-semibold">{t('tasks.list')}</h1>
        <div className="gap-1 p-1 flex rounded-full border bg-muted/40">
          <button
            type="button"
            aria-pressed={screen.view === 'list'}
            onClick={() => {
              screen.setView('list');
            }}
            className={cn(
              'gap-1.5 px-3 h-8 text-xs font-medium flex cursor-pointer items-center rounded-full transition-colors',
              screen.view === 'list'
                ? 'shadow-sm bg-card'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Table2 size={13} aria-hidden />
            {t('tasks.viewList')}
          </button>
          <button
            type="button"
            aria-pressed={screen.view === 'calendar'}
            onClick={() => {
              screen.setView('calendar');
            }}
            className={cn(
              'gap-1.5 px-3 h-8 text-xs font-medium flex cursor-pointer items-center rounded-full transition-colors',
              screen.view === 'calendar'
                ? 'shadow-sm bg-card'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <CalendarDays size={13} aria-hidden />
            {t('tasks.viewCalendar')}
          </button>
        </div>
      </header>

      <Card>
        <ListToolbar screen={screen} />
      </Card>

      {screen.view === 'calendar' ? (
        <Card>
          <ListCalendarView
            items={screen.items}
            onOpen={(item) => {
              setSelected(item);
            }}
          />
        </Card>
      ) : screen.items.length === 0 && !screen.isLoading ? (
        <EmptyState icon={ListTodo} title={t('tasks.noTasks')} />
      ) : (
        <div className="gap-5 flex flex-col">
          {groupItems(screen.items, screen.group).map((section) => (
            <div key={section.key} className="gap-2 flex flex-col">
              {screen.group !== 'none' && (
                <h2 className="px-1 text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                  {section.labelKey ? t(section.labelKey) : section.label}
                  <span className="ml-1.5 font-normal normal-case">({section.items.length})</span>
                </h2>
              )}
              <ul className="gap-2 flex flex-col">
                {section.items.map((item, index) => {
                  const fields = itemFields(item);
                  return (
                    <OccurrenceCard
                      key={`${item.kind}-${fields.id}`}
                      index={index}
                      title={fields.title}
                      time={fields.time}
                      tags={fields.tags}
                      completed={fields.status === 'completada'}
                      priority={fields.priority ?? undefined}
                      hasReminder={item.occurrence.reminder?.enabled ?? false}
                      isPending={setTaskStatus.isPending || setHabitStatus.isPending}
                      onOpen={() => {
                        setSelected(item);
                      }}
                      onToggle={() => {
                        toggle(item);
                      }}
                    />
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}

      <Button
        size="lg"
        onClick={() => {
          setCreating(screen.type === 'habits' ? 'habit' : 'task');
        }}
        className="right-4 bottom-4 shadow-lg sm:static sm:mx-auto sm:w-auto fixed z-10"
      >
        <Plus size={18} aria-hidden />
        {t(screen.type === 'habits' ? 'tasks.addHabit' : 'tasks.add')}
      </Button>

      {selected && (
        <OccurrenceDetailDialog
          occurrence={
            selected.kind === 'task'
              ? { kind: 'task', item: selected.occurrence }
              : { kind: 'habit', item: selected.occurrence }
          }
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
        defaultDate={today}
      />
      <HabitForm
        open={creating === 'habit'}
        onClose={() => {
          setCreating(null);
        }}
        defaultDate={today}
      />
    </section>
  );
}
