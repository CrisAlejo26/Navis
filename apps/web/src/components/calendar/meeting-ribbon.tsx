import type { Meeting, MeetingSlot } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { SlotLine } from '@/components/calendar/slot-line';
import { accentStyles } from '@/lib/calendar/accents';
import { slotMatches, type DisplayFilters } from '@/lib/calendar/filter';
import { cn } from '@/lib/cn';

/**
 * **El elemento firma de la pantalla**: la reunión leída como un tramo de
 * cuaderno de bitácora. Un carril del color de su sede y, colgando de él, una
 * línea por fase con quien la lleva.
 *
 * No es un «evento con puntito»: lo que hay que leer de un vistazo no es que
 * haya algo ese día, es **quién lleva qué** (RFC 0002 §8.1).
 */
export function MeetingRibbon({
  meeting,
  date,
  congregationName,
  onPick,
  filters,
  size = 'md',
  stacked = false,
}: {
  meeting: Meeting;
  /** El día al que pertenece; hace falta para asignar sin volver a buscarlo. */
  date: string;
  /** Solo se escribe cuando hay más de una sede (D12). */
  congregationName?: string;
  onPick?: (slot: MeetingSlot, meeting: Meeting, date: string) => void;
  filters?: DisplayFilters;
  size?: 'sm' | 'md';
  /** Fase encima del nombre: cabe en la columna estrecha del mes sin cortar. */
  stacked?: boolean;
}) {
  const { t } = useTranslation();
  const accent = accentStyles(meeting.accent);
  const cancelled = meeting.status === 'cancelada';

  return (
    <article className={cn('pl-2.5 relative', cancelled && 'opacity-55')}>
      <span
        aria-hidden
        className={cn('left-0 inset-y-0.5 absolute w-[3px] rounded-full', accent.rail)}
      />

      <header className="gap-1.5 px-1 flex items-baseline">
        {congregationName && (
          <span
            className={cn(
              'font-semibold truncate tracking-[0.14em] uppercase',
              size === 'sm' ? 'text-[9px]' : 'text-[10px]',
              accent.text,
            )}
          >
            {congregationName}
          </span>
        )}
        <span className="text-[10px] text-muted-foreground tabular-nums">{meeting.startTime}</span>
        {cancelled && (
          <span className="font-medium text-[10px] text-destructive uppercase">
            {t('calendar.cancelled')}
          </span>
        )}
      </header>

      <ul className="mt-0.5 flex flex-col">
        {meeting.slots.map((slot) => (
          <SlotLine
            key={`${slot.name}-${String(slot.position)}`}
            slot={slot}
            meeting={meeting}
            onPick={
              cancelled || !onPick
                ? undefined
                : (chosen, itsMeeting) => {
                    onPick(chosen, itsMeeting, date);
                  }
            }
            dimmed={filters ? !slotMatches(slot, meeting, filters) : false}
            size={size}
            stacked={stacked}
          />
        ))}
      </ul>
    </article>
  );
}
