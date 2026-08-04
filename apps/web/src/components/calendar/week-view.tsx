import type { CalendarRange, Meeting, MeetingSlot } from '@navis/shared';
import { useRef } from 'react';

import { MeetingRibbon } from '@/components/calendar/meeting-ribbon';
import { useArrowKeys } from '@/components/calendar/use-arrow-keys';
import type { DisplayFilters } from '@/lib/calendar/filter';
import { dayNumber, longDay, shortDay } from '@/lib/calendar/labels';
import { todayIso } from '@/lib/calendar/params';
import { cn } from '@/lib/cn';

/**
 * La semana, para sentarse a programar: siete columnas altas con las fases
 * desplegadas enteras. Es la vista de trabajo; el mes es la de mirar.
 */
export function WeekView({
  range,
  congregationName,
  onOpenDay,
  onPick,
  filters,
}: {
  range: CalendarRange;
  congregationName: (id: string) => string | undefined;
  onOpenDay: (date: string) => void;
  onPick?: (slot: MeetingSlot, meeting: Meeting, date: string) => void;
  filters?: DisplayFilters;
}) {
  const container = useRef<HTMLDivElement>(null);
  const onKeyDown = useArrowKeys(container, 7);
  const today = todayIso();

  return (
    <div
      ref={container}
      className="min-h-0 grid flex-1 grid-cols-7 gap-px overflow-hidden rounded-xl border bg-border"
    >
      {range.days.map((day) => (
        <section key={day.date} className="p-2 gap-3 min-h-0 flex flex-col overflow-y-auto bg-card">
          <header className="gap-1.5 flex items-baseline">
            <button
              type="button"
              data-day-button
              aria-label={longDay(day.date)}
              onKeyDown={onKeyDown}
              onClick={() => {
                onOpenDay(day.date);
              }}
              className="gap-1.5 px-1 -mx-1 flex cursor-pointer items-baseline rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <span
                className={cn(
                  'text-xl font-light tabular-nums',
                  day.date === today && 'font-medium text-brand',
                )}
              >
                {dayNumber(day.date)}
              </span>
              <span className="tracking-wide text-[11px] text-muted-foreground uppercase">
                {shortDay(day.date).replace(/\s*\d+/, '')}
              </span>
            </button>
          </header>

          {day.meetings.map((meeting, index) => (
            <MeetingRibbon
              key={meeting.id ?? `${meeting.patternId ?? 'x'}-${String(index)}`}
              meeting={meeting}
              date={day.date}
              congregationName={congregationName(meeting.congregationId)}
              onPick={onPick}
              filters={filters}
              stacked
            />
          ))}
        </section>
      ))}
    </div>
  );
}
