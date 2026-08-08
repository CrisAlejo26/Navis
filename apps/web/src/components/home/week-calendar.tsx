import { useCalendar, useCalendars } from '@navis/api-client';
import { endOfWeek, startOfWeek } from '@navis/shared';
import { CalendarRange } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { MeetingRibbon } from '@/components/calendar/meeting-ribbon';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { dayNumber, shortDay } from '@/lib/calendar/labels';
import { todayIso } from '@/lib/calendar/params';
import { cn } from '@/lib/cn';

/**
 * La semana actual, de un vistazo (RFC 0001).
 *
 * Empieza en el calendario de púlpito porque es el que se mira cada día; el
 * selector deja pasar a cualquier otro sin salir de la portada.
 */
export function WeekCalendar() {
  const { t } = useTranslation();
  const { data: calendars } = useCalendars(api);
  // `null` es «todavía no ha elegido nadie»: mientras tanto manda el de
  // púlpito, sin un efecto que copie la lista en estado (Regla 1, el mismo
  // patrón que evita el `setState` síncrono de un efecto).
  const [chosen, setChosen] = useState<string | null>(null);
  const calendarId =
    chosen ?? calendars?.find((one) => one.slug === 'pulpito')?.id ?? calendars?.[0]?.id ?? '';

  const today = todayIso();
  const { data: range } = useCalendar(api, {
    calendarId,
    from: startOfWeek(today),
    to: endOfWeek(today),
  });

  const nameOf = (id: string) =>
    (range?.congregations.length ?? 0) > 1
      ? range?.congregations.find((one) => one.id === id)?.name
      : undefined;

  return (
    <div className="p-5 gap-3 flex flex-col rounded-xl border bg-card">
      <div className="gap-3 flex flex-wrap items-center justify-between">
        <h3 className="gap-2 text-sm font-semibold flex items-center">
          <CalendarRange size={15} aria-hidden className="text-muted-foreground" />
          {t('home.thisWeek')}
        </h3>

        {calendars && calendars.length > 1 && (
          <Select
            size="sm"
            aria-label={t('home.chooseCalendar')}
            value={calendarId}
            onChange={(event) => {
              setChosen(event.target.value);
            }}
          >
            {calendars.map((one) => (
              <option key={one.id} value={one.id}>
                {one.name}
              </option>
            ))}
          </Select>
        )}
      </div>

      {!range ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <div className="min-w-0 -mx-1 px-1 overflow-x-auto">
          <div className="gap-2 grid min-w-[46rem] grid-cols-7">
            {range.days.map((day) => (
              <div key={day.date} className="p-2 gap-1.5 min-h-32 flex flex-col rounded-lg border">
                <p className="gap-1 flex items-baseline">
                  <span
                    className={cn(
                      'text-sm font-semibold tabular-nums',
                      day.date === today && 'text-primary',
                    )}
                  >
                    {dayNumber(day.date)}
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase">
                    {shortDay(day.date).replace(/\s*\d+/, '')}
                  </span>
                </p>

                {day.meetings.map((meeting, index) => (
                  <MeetingRibbon
                    key={meeting.id ?? `${meeting.patternId ?? 'x'}-${String(index)}`}
                    meeting={meeting}
                    date={day.date}
                    congregationName={nameOf(meeting.congregationId)}
                    size="sm"
                    stacked
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      <Link
        to="/calendar"
        className="text-xs font-medium text-primary underline-offset-4 hover:underline"
      >
        {t('home.calendarLink')}
      </Link>
    </div>
  );
}
