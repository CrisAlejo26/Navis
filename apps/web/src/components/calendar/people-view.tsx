import type { CalendarRange } from '@navis/shared';
import { Users } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/ui/empty-state';
import { ACCENT_RAIL, accentVars } from '@/lib/calendar/accents';
import { dayNumber } from '@/lib/calendar/labels';
import { peopleRows } from '@/lib/calendar/people';
import { cn } from '@/lib/cn';

/**
 * El calendario girado: una fila por persona, una columna por día.
 *
 * Responde de un vistazo a la pregunta que nunca contesta una rejilla —quién
 * sube tres veces esta semana y quién lleva un mes sin subir—, y por eso las
 * filas van ordenadas por número de turnos, no por nombre.
 */
export function PeopleView({
  range,
  onPickPerson,
}: {
  range: CalendarRange;
  /** Filtra el calendario por esa persona: la fila es también un enlace. */
  onPickPerson: (believerId: string) => void;
}) {
  const { t } = useTranslation();
  const rows = useMemo(() => peopleRows(range), [range]);

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border bg-card">
        <EmptyState icon={Users} title={t('calendar.empty')}>
          {t('calendar.emptyHint')}
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-auto rounded-xl border bg-card">
      <table className="border-spacing-0 text-sm w-full border-separate">
        <thead>
          <tr>
            <th className="left-0 px-3 py-2 font-semibold sticky z-10 border-b bg-card text-left text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
              {t('calendar.viewPeople')}
            </th>
            {range.days.map((day) => (
              <th
                key={day.date}
                className="w-7 py-2 font-normal border-b bg-card text-center text-[10px] text-muted-foreground tabular-nums"
              >
                {dayNumber(day.date)}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="group">
              <th scope="row" className="left-0 px-3 py-1.5 sticky z-10 border-b bg-card text-left">
                <button
                  type="button"
                  onClick={() => {
                    onPickPerson(row.id);
                  }}
                  className="gap-2 flex cursor-pointer items-baseline rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <span className="font-medium truncate">{row.name}</span>
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {row.times}
                  </span>
                </button>
              </th>

              {range.days.map((day) => {
                const turnos = row.days.get(day.date) ?? [];
                return (
                  <td key={day.date} className="p-0 border-b text-center align-middle">
                    {turnos.length > 0 && (
                      <span
                        title={turnos.map((turno) => turno.detail).join(' · ')}
                        style={accentVars(turnos[0]?.accent ?? 'primary')}
                        className={cn('h-4 w-4 mx-auto block rounded-[4px]', ACCENT_RAIL)}
                      >
                        <span className="sr-only">{turnos[0]?.detail}</span>
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
