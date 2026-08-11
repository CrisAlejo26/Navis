import { BellRing } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/cn';

export interface ReminderDraft {
  /** `AAAA-MM-DDTHH:MM`, tal cual lo da un `datetime-local`. Vacío es apagado. */
  at: string;
  text: string;
}

/**
 * Los textos, ya traducidos: la bitácora de creyentes y el cuaderno de la
 * iglesia (RFC 0017 D6) usan el mismo componente con su propio vocabulario, y
 * eso se resuelve con props y no con una clave `notes.reminder.*` fija por
 * dentro (Regla 1 §3, «mapa de variantes»).
 */
export interface ReminderLabels {
  toggle: string;
  when: string;
  what: string;
  whatHint?: string;
}

/** Por defecto, dentro de una semana a las siete de la tarde. */
function enUnaSemana(): string {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  date.setHours(19, 0, 0, 0);

  const dos = (value: number) => String(value).padStart(2, '0');
  return `${String(date.getFullYear())}-${dos(date.getMonth() + 1)}-${dos(date.getDate())}T19:00`;
}

/**
 * **El recordatorio de una nota**: un interruptor que, al encenderse, abre el
 * día, la hora y de qué hay que acordarse (D16).
 *
 * Lleva hora y no solo día porque un recordatorio pastoral es «el martes antes
 * del culto», no «el martes». Y trae una fecha propuesta —dentro de una
 * semana— porque quien lo enciende ya sabe que quiere acordarse, no quiere
 * además decidir cuándo desde una casilla vacía.
 */
export function ReminderField({
  value,
  onChange,
  labels,
}: {
  value: ReminderDraft;
  onChange: (value: ReminderDraft) => void;
  labels: ReminderLabels;
}) {
  const on = value.at !== '';

  return (
    <div className="gap-3 p-3.5 flex flex-col rounded-lg border border-warning/30 bg-warning/5">
      <label className="gap-3 flex cursor-pointer items-center">
        <input
          type="checkbox"
          checked={on}
          onChange={(event) => {
            onChange({ at: event.target.checked ? enUnaSemana() : '', text: value.text });
          }}
          className="h-4 w-4 accent-[var(--color-warning)]"
        />
        <span className="gap-2 text-sm font-medium inline-flex items-center">
          <BellRing size={15} aria-hidden className="text-warning" />
          {labels.toggle}
        </span>
      </label>

      {on && (
        <div className={cn('gap-3 flex flex-col')}>
          <Input
            name="remindAt"
            type="datetime-local"
            label={labels.when}
            value={value.at}
            onChange={(event) => {
              onChange({ ...value, at: event.target.value });
            }}
          />
          <Input
            name="remindText"
            label={labels.what}
            hint={labels.whatHint}
            value={value.text}
            onChange={(event) => {
              onChange({ ...value, text: event.target.value });
            }}
          />
        </div>
      )}
    </div>
  );
}
