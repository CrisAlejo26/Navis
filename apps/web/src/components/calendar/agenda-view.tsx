import type { CalendarRange, Meeting, MeetingSlot } from '@navis/shared';
import { CalendarDays } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { MeetingRibbon } from '@/components/calendar/meeting-ribbon';
import { EmptyState } from '@/components/ui/empty-state';
import type { DisplayFilters } from '@/lib/calendar/filter';
import { longDay } from '@/lib/calendar/labels';
import { todayIso } from '@/lib/calendar/params';
import { cn } from '@/lib/cn';

/**
 * La lista continua por días. Es lo que se ve en un teléfono —donde una
 * rejilla de siete columnas no se lee— y también la forma cómoda de repasar
 * varias semanas seguidas en escritorio.
 */
export function AgendaView({
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
  const { t } = useTranslation();
  const today = todayIso();
  const conReuniones = range.days.filter((day) => day.meetings.length > 0);

  if (conReuniones.length === 0) {
    return (
      <div className="rounded-xl border bg-card">
        <EmptyState icon={CalendarDays} title={t('calendar.empty')}>
          {t('calendar.emptyHint')}
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="gap-3 flex flex-1 flex-col overflow-y-auto">
      {conReuniones.map((day) => (
        <section key={day.date} className="rounded-xl border bg-card">
          <button
            type="button"
            data-day-button
            onClick={() => {
              onOpenDay(day.date);
            }}
            className={cn(
              'px-4 pt-3 pb-1 text-sm font-medium w-full cursor-pointer text-left',
              'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
              day.date === today && 'text-brand',
            )}
          >
            {longDay(day.date)}
          </button>

          <div className="px-3 pb-3 gap-3 flex flex-col">
            {day.meetings.map((meeting, index) => (
              <MeetingRibbon
                key={meeting.id ?? `${meeting.patternId ?? 'x'}-${String(index)}`}
                meeting={meeting}
                date={day.date}
                congregationName={congregationName(meeting.congregationId)}
                onPick={onPick}
                filters={filters}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
