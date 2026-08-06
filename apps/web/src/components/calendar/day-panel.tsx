import type { CalendarDay, Congregation, Meeting, MeetingSlot } from '@navis/shared';
import { CalendarPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { MeetingRibbon } from '@/components/calendar/meeting-ribbon';
import { Button } from '@/components/ui/button';
import { Drawer } from '@/components/ui/drawer';
import { holidayScopeLabel } from '@/lib/calendar/holiday';
import { longDay } from '@/lib/calendar/labels';
import { cn } from '@/lib/cn';

/**
 * El día abierto, con **una sección por sede**.
 *
 * Es el caso que hoy obliga a llevar tres pestañas de la hoja de cálculo: el
 * mismo viernes con la programación de Benidorm, Alicante y Elda. Las sedes sin
 * nada ese día no desaparecen —se quedan al final, en una línea, esperando a
 * que alguien las programe—.
 */
export function DayPanel({
  date,
  day,
  congregations,
  onClose,
  onPick,
  onAddFor,
  canManage,
}: {
  date: string | null;
  day: CalendarDay | undefined;
  congregations: readonly Congregation[];
  onClose: () => void;
  onPick?: (slot: MeetingSlot, meeting: Meeting, date: string) => void;
  /** Programar una sede que ese día no tiene nada. */
  onAddFor: (congregationId: string) => void;
  canManage: boolean;
}) {
  const { t } = useTranslation();
  const meetings = day?.meetings ?? [];
  const withMeetings = new Set(meetings.map((meeting) => meeting.congregationId));
  const varias = congregations.length > 1;

  return (
    <Drawer
      open={Boolean(date)}
      onClose={onClose}
      side="right"
      width="min(24rem, 92vw)"
      title={date ? longDay(date) : ''}
    >
      <div className="p-4 gap-5 flex flex-1 flex-col">
        {/*
         * El festivo, arriba del todo y antes que las sedes: es el dato con el
         * que se decide si se adelanta la reunión, y para eso hay que verlo al
         * abrir el día, no al final.
         */}
        {day?.holiday && (
          <p className="gap-2 px-3 py-2 text-sm flex items-start rounded-lg bg-muted">
            <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-destructive" />
            <span className="min-w-0">
              <span className="font-medium">{day.holiday.name}</span>
              <span className="text-xs block text-muted-foreground">
                {holidayScopeLabel(day.holiday, t)}
              </span>
            </span>
          </p>
        )}

        {congregations
          .filter((congregation) => withMeetings.has(congregation.id))
          .map((congregation) => (
            <section key={congregation.id} className="gap-3 flex flex-col">
              {varias && (
                <h3 className="font-semibold text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
                  {congregation.name}
                </h3>
              )}

              {meetings
                .filter((meeting) => meeting.congregationId === congregation.id)
                .map((meeting, index) => (
                  <MeetingRibbon
                    key={meeting.id ?? `${meeting.patternId ?? 'x'}-${String(index)}`}
                    meeting={meeting}
                    date={date ?? ''}
                    onPick={canManage ? onPick : undefined}
                  />
                ))}
            </section>
          ))}

        {congregations
          .filter((congregation) => !withMeetings.has(congregation.id) && congregation.isActive)
          .map((congregation) => (
            <button
              key={congregation.id}
              type="button"
              disabled={!canManage}
              onClick={() => {
                onAddFor(congregation.id);
              }}
              className={cn(
                'px-2 py-2 gap-2 text-sm flex items-baseline rounded-lg text-left text-muted-foreground',
                canManage && 'cursor-pointer hover:bg-muted hover:text-foreground',
                'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
              )}
            >
              <span className="font-medium">{congregation.name}</span>
              <span className="text-xs">{t('calendar.noProgramme')}</span>
            </button>
          ))}

        {canManage && (
          <Button
            variant="secondary"
            size="lg"
            className="mt-auto w-full"
            onClick={() => {
              onAddFor(congregations[0]?.id ?? '');
            }}
          >
            <CalendarPlus size={16} aria-hidden />
            {varias ? t('calendar.addForAnother') : t('calendar.addMeeting')}
          </Button>
        )}
      </div>
    </Drawer>
  );
}
