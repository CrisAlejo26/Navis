import { useDashboardSummary } from '@navis/api-client';
import { useTranslation } from 'react-i18next';

import { ActivityCard } from '@/components/home/activity-card';
import { CompositionSection } from '@/components/home/composition-section';
import { EventsCard } from '@/components/home/events-card';
import { NotesCard } from '@/components/home/notes-card';
import { StatusCard } from '@/components/home/status-card';
import { TodayTasksCard } from '@/components/home/today-tasks-card';
import { WeekCalendar } from '@/components/home/week-calendar';
import { WelcomeHeader } from '@/components/home/welcome-header';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { api } from '@/lib/api';

/**
 * El panel de inicio (RFC 0001): las tarjetas de métricas, el reparto de la
 * iglesia, la actividad reciente y la semana del calendario, todo en una sola
 * llamada al servidor.
 */
export function DashboardPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useDashboardSummary(api);

  if (isLoading || !data) return <PageSkeleton />;

  return (
    <section className="gap-6 animate-page-in flex flex-col">
      <WelcomeHeader />

      <div className="gap-4 sm:grid-cols-2 lg:grid-cols-4 grid">
        <StatusCard
          believers={data.believers}
          attention={data.attention}
          className="sm:col-span-2 lg:col-span-2"
        />
        <EventsCard events={data.upcomingEvents} />
        <NotesCard notes={data.recentNotes} />
        <TodayTasksCard
          tasks={data.todayTasks}
          streak={data.taskStreak}
          className="sm:col-span-2 lg:col-span-4"
        />
      </div>

      <WeekCalendar />

      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
          {t('home.composition')}
        </h2>
        <CompositionSection composition={data.composition} />
      </div>

      <ActivityCard weeks={data.weeklyActivity} />
    </section>
  );
}
