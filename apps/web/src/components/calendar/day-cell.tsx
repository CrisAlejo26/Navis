import type { CalendarDay, Meeting, MeetingSlot } from '@navis/shared';

import { HolidayMark } from '@/components/calendar/holiday-mark';
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
        /*
         * Hoy se tiñe **la celda entera**, no una raya en el borde: entre
         * carriles de colores de las sedes, una línea de tres píxeles no se
         * encuentra.
         *
         * Y se tiñe de **ámbar**, no del azul de marca: en azul suave la celda
         * se confundía con el gris de los días de otro mes, que están al lado y
         * tienen una claridad parecida. El ámbar es cálido y no hay nada más
         * cálido en la rejilla, así que se encuentra sin buscarlo.
         */
        isToday && 'bg-accent/30 dark:bg-accent/20',
        selected && 'ring-2 ring-ring ring-inset',
      )}
    >
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
            // El número, en negrita y del color del texto: sobre el ámbar, el
            // propio ámbar no tendría contraste, y la celda ya dice cuál es.
            isToday && 'font-semibold',
          )}
        >
          {dayNumber(day.date)}
        </span>
      </button>

      {day.holiday && <HolidayMark holiday={day.holiday} compact={compact} />}

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
