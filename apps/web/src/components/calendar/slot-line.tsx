import type { Meeting, MeetingSlot } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/cn';

/**
 * Una fase y quién la ocupa: `INTRODUCCIÓN  Juan Carlos`.
 *
 * Los huecos **no se esconden**. Una fase sin nadie es una línea de puntos que
 * pide que la rellenen, y es justo la información que hoy se pierde en la hoja
 * de cálculo (RFC 0002 §8.1).
 *
 * Dos disposiciones, que es lo que decide el conmutador de densidad: `stacked`
 * pone la fase encima del nombre y no corta ninguno de los dos —cabe en una
 * columna estrecha del mes—; `inline` los pone en una línea y abrevia, para
 * ver más días de golpe.
 */
export function SlotLine({
  slot,
  meeting,
  onPick,
  dimmed = false,
  size = 'md',
  stacked = false,
}: {
  slot: MeetingSlot;
  meeting: Meeting;
  /** Sin esto, la línea no es un botón: quien no puede programar solo lee. */
  onPick?: (slot: MeetingSlot, meeting: Meeting) => void;
  /** Atenuada porque hay un filtro puesto y esta fase no es de las buscadas. */
  dimmed?: boolean;
  size?: 'sm' | 'md';
  stacked?: boolean;
}) {
  const { t } = useTranslation();
  const name = slot.believer?.name;

  const phase = (
    <span
      title={slot.name}
      className={cn(
        'font-semibold truncate tracking-[0.1em] text-muted-foreground uppercase',
        stacked ? 'text-[9px]' : 'shrink-0',
        !stacked && (size === 'sm' ? 'w-11 text-[9px]' : 'w-[5.5rem] text-[10px]'),
      )}
    >
      {slot.name}
    </span>
  );

  const person = name ? (
    <span
      title={name}
      className={cn(
        'font-medium truncate',
        stacked ? 'text-[12px]' : size === 'sm' ? 'text-[11px]' : 'text-[13px]',
      )}
    >
      {name}
    </span>
  ) : (
    <span className={cn('gap-1.5 min-w-0 flex items-center', stacked ? 'h-4' : 'flex-1')}>
      <span aria-hidden className="flex-1 border-b border-dashed border-muted-foreground/45" />
      <span className="sr-only">{t('calendar.unassigned')}</span>
    </span>
  );

  const content = stacked ? (
    <span className="min-w-0 leading-tight flex flex-1 flex-col">
      {phase}
      {person}
    </span>
  ) : (
    <>
      {phase}
      {person}
    </>
  );

  const shared = cn(
    'gap-2 px-1 flex w-full rounded-md text-left',
    stacked ? 'py-0.5 items-stretch' : 'items-baseline',
    !stacked && (size === 'sm' ? 'py-px' : 'py-0.5'),
    dimmed && 'opacity-35',
  );

  if (!onPick) {
    return <li className={cn(shared, 'cursor-default')}>{content}</li>;
  }

  return (
    <li>
      <button
        type="button"
        onClick={() => {
          onPick(slot, meeting);
        }}
        aria-label={`${slot.name}: ${name ?? t('calendar.unassigned')}`}
        className={cn(
          shared,
          'cursor-pointer transition-colors duration-150 hover:bg-muted',
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        )}
      >
        {content}
      </button>
    </li>
  );
}
