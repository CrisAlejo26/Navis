import type { CalendarRange, Meeting, MeetingSlot } from '@navis/shared';

import { AgendaView } from '@/components/calendar/agenda-view';
import { MonthGrid } from '@/components/calendar/month-grid';
import { PeopleView } from '@/components/calendar/people-view';
import { WeekView } from '@/components/calendar/week-view';
import type { DisplayFilters } from '@/lib/calendar/filter';
import type { CalendarView } from '@/lib/calendar/view-range';

/**
 * Qué vista se pinta. Las cuatro comparten tramo, filtros y acciones: son
 * cuatro maneras de mirar lo mismo, no cuatro pantallas.
 *
 * Por debajo de `md` siempre manda la agenda: una rejilla de siete columnas en
 * un teléfono no se lee (Regla 5).
 */
export function CalendarViews({
  view,
  range,
  anchor,
  narrow,
  selectedDate,
  filters,
  congregationName,
  onOpenDay,
  onPick,
  onPickPerson,
}: {
  view: CalendarView;
  range: CalendarRange;
  anchor: string;
  narrow: boolean;
  selectedDate: string | null;
  filters: DisplayFilters;
  congregationName: (id: string) => string | undefined;
  onOpenDay: (date: string) => void;
  onPick?: (slot: MeetingSlot, meeting: Meeting, date: string) => void;
  onPickPerson: (believerId: string) => void;
}) {
  const shared = { range, congregationName, onOpenDay, onPick, filters };

  if (view === 'people' && !narrow) {
    return <PeopleView range={range} onPickPerson={onPickPerson} />;
  }

  if (narrow || view === 'agenda') return <AgendaView {...shared} />;
  if (view === 'week') return <WeekView {...shared} />;

  return <MonthGrid {...shared} anchorMonth={anchor} selectedDate={selectedDate} />;
}
