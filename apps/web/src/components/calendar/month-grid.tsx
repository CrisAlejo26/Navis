import type { CalendarRange, Meeting, MeetingSlot } from '@navis/shared';
import { useRef } from 'react';

import { DayCell } from '@/components/calendar/day-cell';
import { useArrowKeys } from '@/components/calendar/use-arrow-keys';
import type { DisplayFilters } from '@/lib/calendar/filter';
import { monthTitle, weekdayHeadings } from '@/lib/calendar/labels';
import { todayIso } from '@/lib/calendar/params';
import { useDensityStore } from '@/lib/calendar/density';
import { cn } from '@/lib/cn';

/**
 * El mes a pantalla completa: siete columnas, filas que crecen con el día más
 * cargado y, si un día se pasa, **scroll dentro de su propia celda** —nunca la
 * página en horizontal (Regla 5)—.
 */
export function MonthGrid({
  range,
  anchorMonth,
  congregationName,
  onOpenDay,
  onPick,
  selectedDate,
  filters,
}: {
  range: CalendarRange;
  /** El mes que se está mirando; los días de fuera se apagan. */
  anchorMonth: string;
  congregationName: (id: string) => string | undefined;
  onOpenDay: (date: string) => void;
  onPick?: (slot: MeetingSlot, meeting: Meeting, date: string) => void;
  selectedDate?: string | null;
  filters?: DisplayFilters;
}) {
  const grid = useRef<HTMLDivElement>(null);
  const onKeyDown = useArrowKeys(grid, 7);
  const compact = useDensityStore((state) => state.density) === 'compact';
  const today = todayIso();
  const month = anchorMonth.slice(0, 7);

  return (
    <div className="min-h-0 flex flex-1 flex-col overflow-hidden rounded-xl border bg-border">
      <div className="grid shrink-0 grid-cols-7 bg-card">
        {weekdayHeadings().map((heading) => (
          <div
            key={heading.key}
            className="px-2 py-2 font-semibold text-[11px] tracking-[0.14em] text-muted-foreground uppercase"
          >
            {heading.label}
          </div>
        ))}
      </div>

      {/*
       * El scroll va **fuera** de la rejilla, no en ella: con un alto fijo, el
       * navegador reparte el que hay entre las filas y encoge la del día más
       * cargado hasta cortarle una fase. Con la rejilla a su altura natural
       * dentro de un contenedor que se desplaza, cada semana ocupa lo que
       * necesita y no se pierde nada de vista.
       */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div
          ref={grid}
          aria-label={monthTitle(anchorMonth)}
          className={cn(
            'grid grid-cols-7 gap-px',
            compact ? 'auto-rows-[minmax(5rem,auto)]' : 'auto-rows-[minmax(7rem,auto)]',
          )}
        >
          {range.days.map((day) => (
            <DayCell
              key={day.date}
              day={day}
              outside={!day.date.startsWith(month)}
              isToday={day.date === today}
              selected={day.date === selectedDate}
              compact={compact}
              congregationName={congregationName}
              onOpen={onOpenDay}
              onPick={onPick}
              filters={filters}
              onKeyDown={onKeyDown}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
