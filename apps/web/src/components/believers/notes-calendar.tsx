import { eachDay, type NoteDay } from '@navis/shared';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { accentVars } from '@/lib/accents';
import { NOTE_ORDER, NOTE_STYLES } from '@/lib/believers/note-kinds';
import { cn } from '@/lib/cn';
import { formatDay, formatMonth } from '@/lib/format';

/** El lunes es el primer día de la semana; la semana europea empieza ahí. */
const DIAS_ANTES = (iso: string) => (new Date(`${iso}T00:00:00Z`).getUTCDay() + 6) % 7;

/**
 * La bitácora como **calendario del año**: un cuadrito por día, encendido del
 * color de lo que se escribió ese día.
 *
 * Es la única de las cuatro vistas que enseña **lo que no hay**. Las otras tres
 * listan notas; esta deja ver los tres meses seguidos en los que nadie escribió
 * nada, que es exactamente la pregunta de esta sección (§7.1).
 *
 * Los cuadros van `aria-hidden` y cada mes lleva su resumen para lector de
 * pantalla: doscientos cuadritos leídos uno a uno no son información.
 */
export function NotesCalendar({
  year,
  days,
  onYearChange,
}: {
  year: number;
  days: readonly NoteDay[];
  onYearChange: (year: number) => void;
}) {
  const { t } = useTranslation();

  const byDate = useMemo(() => new Map(days.map((day) => [day.date, day])), [days]);
  const meses = useMemo(
    () =>
      Array.from({ length: 12 }, (_unused, index) => {
        const mes = `${String(year)}-${String(index + 1).padStart(2, '0')}`;
        const ultimo = new Date(Date.UTC(year, index + 1, 0)).getUTCDate();
        return { mes, dias: eachDay(`${mes}-01`, `${mes}-${String(ultimo)}`) };
      }),
    [year],
  );

  const total = days.reduce((suma, day) => suma + day.total, 0);

  return (
    <div className="gap-4 flex flex-col">
      <div className="gap-2 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('notes.previousYear')}
          onClick={() => {
            onYearChange(year - 1);
          }}
        >
          <ChevronLeft size={16} aria-hidden />
        </Button>

        <p className="text-sm font-semibold tabular-nums">{year}</p>

        <Button
          variant="ghost"
          size="icon"
          aria-label={t('notes.nextYear')}
          onClick={() => {
            onYearChange(year + 1);
          }}
        >
          <ChevronRight size={16} aria-hidden />
        </Button>
      </div>

      {total === 0 && (
        <p className="py-6 text-sm text-center text-muted-foreground">
          {t('notes.calendarEmpty', { year: String(year) })}
        </p>
      )}

      <div className="gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 grid">
        {meses.map(({ mes, dias }) => {
          const delMes = dias.filter((day) => byDate.has(day));

          return (
            <section key={mes}>
              <h4 className="mb-1.5 font-medium text-[11px] tracking-[0.08em] text-muted-foreground uppercase">
                {formatMonth(mes)}
              </h4>

              <div aria-hidden className="grid grid-cols-7 gap-[3px]">
                {/* Los huecos del principio: el mes no siempre empieza en lunes. */}
                {Array.from({ length: DIAS_ANTES(dias[0] ?? `${mes}-01`) }, (_unused, index) => (
                  <span key={`hueco-${String(index)}`} />
                ))}

                {dias.map((day) => {
                  const note = byDate.get(day);
                  const kind = note?.kinds[0];

                  return (
                    <span
                      key={day}
                      title={
                        note
                          ? t('notes.calendarDay', {
                              date: formatDay(day, 'short'),
                              total: String(note.total),
                            })
                          : formatDay(day, 'short')
                      }
                      style={kind ? accentVars(NOTE_STYLES[kind].accent) : undefined}
                      className={cn(
                        'aspect-square rounded-[3px]',
                        kind ? 'bg-[var(--acento)]' : 'bg-muted',
                      )}
                    />
                  );
                })}
              </div>

              <span className="sr-only">
                {delMes.length === 0
                  ? t('notes.calendarEmpty', { year: formatMonth(mes) })
                  : delMes
                      .map((day) =>
                        t('notes.calendarDay', {
                          date: formatDay(day, 'short'),
                          total: String(byDate.get(day)?.total ?? 0),
                        }),
                      )
                      .join('. ')}
              </span>
            </section>
          );
        })}
      </div>

      {/* La leyenda: sin ella los colores no dicen nada (Regla 3 §7). */}
      <ul className="gap-x-3 gap-y-1 flex flex-wrap">
        {NOTE_ORDER.map((kind) => (
          <li
            key={kind}
            style={accentVars(NOTE_STYLES[kind].accent)}
            className="gap-1.5 inline-flex items-center text-[11px] text-muted-foreground"
          >
            <span aria-hidden className="h-2 w-2 rounded-[2px] bg-[var(--acento)]" />
            {t(NOTE_STYLES[kind].labelKey)}
          </li>
        ))}
      </ul>
    </div>
  );
}
