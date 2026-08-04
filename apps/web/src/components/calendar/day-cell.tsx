import type { CalendarDay, Meeting, MeetingSlot } from '@navis/shared';

import { MeetingRibbon } from '@/components/calendar/meeting-ribbon';
import { dayNumber, longDay } from '@/lib/calendar/labels';
import type { DisplayFilters } from '@/lib/calendar/filter';
import { cn } from '@/lib/cn';

export interface DayCellProps {
  day: CalendarDay;
  /** Fuera del mes que se está mirando: se apaga, no se esconde. */
  outside?: boolean;
  isToday?: boolean;
  selected?: boolean;
  compact?: boolean;
  congregationName: (id: string) => string | undefined;
  onOpen: (date: string) => void;
  onPick?: (slot: MeetingSlot, meeting: Meeting, date: string) => void;
  filters?: DisplayFilters;
  /** Las flechas mueven el foco por la rejilla (ver `useArrowKeys`). */
  onKeyDown?: (event: React.KeyboardEvent<HTMLElement>) => void;
}

/**
 * Un día de la rejilla: el número, y debajo sus reuniones.
 *
 * **Hoy** no es un círculo azul genérico: es una barra de marca en el borde
 * superior de la celda y el número en el azul de la marca. Una sola señal, y
 * se ve desde lejos (Regla 9: una audacia por pantalla, el resto en voz baja).
 */
export function DayCell({
  day,
  outside = false,
  isToday = false,
  selected = false,
  compact = false,
  congregationName,
  onOpen,
  onPick,
  filters,
  onKeyDown,
}: DayCellProps) {
  return (
    <div
      className={cn(
        'p-1.5 gap-1 relative flex flex-col border-t border-l bg-card',
        outside && 'bg-muted/25 text-muted-foreground',
        selected && 'ring-2 ring-ring ring-inset',
      )}
    >
      {isToday && <span aria-hidden className="top-0 inset-x-0 absolute h-[3px] bg-brand" />}

      <button
        type="button"
        data-day-button
        aria-label={longDay(day.date)}
        onKeyDown={onKeyDown}
        onClick={() => {
          onOpen(day.date);
        }}
        className={cn(
          'px-1 -mx-1 cursor-pointer self-start rounded-md text-left',
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        )}
      >
        <span
          className={cn(
            'font-light tabular-nums',
            compact ? 'text-lg' : 'text-2xl',
            isToday && 'font-medium text-brand',
          )}
        >
          {dayNumber(day.date)}
        </span>
      </button>

      <div className={cn('gap-2 flex flex-col', compact && 'gap-1')}>
        {day.meetings.map((meeting, index) => (
          <MeetingRibbon
            key={meeting.id ?? `${meeting.patternId ?? 'x'}-${String(index)}`}
            meeting={meeting}
            date={day.date}
            congregationName={congregationName(meeting.congregationId)}
            onPick={onPick}
            filters={filters}
            size="sm"
            stacked={!compact}
          />
        ))}
      </div>
    </div>
  );
}
