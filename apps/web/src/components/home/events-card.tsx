import type { DashboardEvent } from '@navis/shared';
import { CalendarClock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { TileHeader } from '@/components/home/tile-header';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { accentVars } from '@/lib/accents';
import { cn } from '@/lib/cn';
import { formatDay } from '@/lib/format';
import { ACCENT_TONE } from '@/lib/stat-tones';

/**
 * Los próximos eventos del calendario de púlpito (RFC 0001).
 *
 * Mismo tratamiento de cabecera y filo que `MetricCard`, con el acento
 * `primary` del propio calendario: es la tercera cara del instrumento de la
 * primera fila, no una tarjeta de lista aparte.
 */
export function EventsCard({ events }: { events: readonly DashboardEvent[] }) {
  const { t } = useTranslation();

  return (
    <Card className={cn('p-0 gap-0 flex flex-col overflow-hidden', ACCENT_TONE.primary.edge)}>
      <div className="p-5 pb-3">
        <TileHeader icon={CalendarClock} label={t('home.upcomingEvents')} tone="primary" />
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
