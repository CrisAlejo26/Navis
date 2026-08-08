import type { DashboardEvent } from '@navis/shared';
import { CalendarClock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { accentVars } from '@/lib/accents';
import { formatDay } from '@/lib/format';

/** Los próximos eventos del calendario de púlpito (RFC 0001). */
export function EventsCard({ events }: { events: readonly DashboardEvent[] }) {
  const { t } = useTranslation();

  return (
    <Card className="p-0 gap-0 flex flex-col overflow-hidden">
      <div className="p-5 pb-3 gap-2 flex items-center text-muted-foreground">
        <CalendarClock size={16} aria-hidden />
        <p className="text-sm font-medium">{t('home.upcomingEvents')}</p>
      </div>

      {events.length === 0 ? (
        <EmptyState icon={CalendarClock} title={t('home.noUpcomingEvents')} />
      ) : (
        <ul className="divide-y">
          {events.map((event) => (
            <li
              key={`${event.date}-${event.startTime}-${event.name}`}
              style={accentVars(event.accent)}
              className="px-5 py-2.5 pl-4 border-l-[3px] border-l-[var(--acento)]"
            >
              <p className="text-sm font-medium">{event.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatDay(event.date, 'short')} · {event.startTime} · {event.congregationName}
              </p>
            </li>
          ))}
        </ul>
      )}

      <Link
        to="/calendar"
        className="p-5 pt-3 text-xs font-medium mt-auto text-primary underline-offset-4 hover:underline"
      >
        {t('home.calendarLink')}
      </Link>
    </Card>
  );
}
