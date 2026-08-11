import { eachDay, type JournalEntryListItem } from '@navis/shared';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Button } from '@/components/ui/button';
import { accentVars } from '@/lib/accents';
import { cn } from '@/lib/cn';
import { ENTRY_KIND_ORDER, ENTRY_KIND_STYLES } from '@/lib/journal/entry-kind';
import { formatDay, formatMonth } from '@/lib/format';

/** El lunes es el primer día de la semana; la semana europea empieza ahí. */
const DIAS_ANTES = (iso: string) => (new Date(`${iso}T00:00:00Z`).getUTCDay() + 6) % 7;

/**
 * El cuaderno como **calendario del año**: un cuadrito por día (§7.5).
 *
 * Es la única de las tres vistas que enseña **lo que no hay**: las semanas
 * seguidas sin nada anotado, que es justo lo que un cuaderno descuidado no
 * puede contar por sí solo. Dos tipos el mismo día se pintan como dos
 * triángulos, con `clip-path`, en vez de perder uno de los dos colores.
 *
 * Opera sobre las entradas de la **página actual**, como la vista de año de
 * profecías: para ver más días, se sube el tamaño de página.
 */
export function JournalCalendar({ items }: { items: readonly JournalEntryListItem[] }) {
  const { t } = useTranslation();
  const years = useMemo(
    () => [...new Set(items.map((one) => one.occurredAt.slice(0, 4)))].sort().reverse(),
    [items],
  );
  const [year, setYear] = useState(() => years[0] ?? String(new Date().getFullYear()));
  const activeYear = years.includes(year) ? year : (years[0] ?? year);

  const byDate = useMemo(() => {
    const map = new Map<string, JournalEntryListItem['kind'][]>();
    for (const item of items) {
      const kinds = map.get(item.occurredAt) ?? [];
      if (!kinds.includes(item.kind)) kinds.push(item.kind);
      map.set(item.occurredAt, kinds);
    }
    return map;
  }, [items]);

  const meses = useMemo(
    () =>
      Array.from({ length: 12 }, (_unused, index) => {
        const mes = `${activeYear}-${String(index + 1).padStart(2, '0')}`;
        const ultimo = new Date(Date.UTC(Number(activeYear), index + 1, 0)).getUTCDate();
        return { mes, dias: eachDay(`${mes}-01`, `${mes}-${String(ultimo)}`) };
      }),
    [activeYear],
  );

  const total = [...byDate.keys()].filter((day) => day.startsWith(activeYear)).length;

  return (
    <div className="gap-6 p-4 sm:p-5 flex flex-col rounded-xl border bg-card">
      <div className="gap-2 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('journal.previousYear')}
          disabled={years.indexOf(activeYear) >= years.length - 1}
          onClick={() => {
            setYear(String(Number(activeYear) - 1));
          }}
        >
          <ChevronLeft size={16} aria-hidden />
        </Button>

        <p className="text-sm font-semibold tabular-nums">{activeYear}</p>

        <Button
          variant="ghost"
          size="icon"
          aria-label={t('journal.nextYear')}
          disabled={years.indexOf(activeYear) <= 0}
          onClick={() => {
            setYear(String(Number(activeYear) + 1));
          }}
        >
          <ChevronRight size={16} aria-hidden />
        </Button>
      </div>

      {total === 0 && (
        <p className="py-6 text-sm text-center text-muted-foreground">
          {t('journal.calendarEmpty', { year: activeYear })}
        </p>
      )}

      <div className="gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 grid">
        {meses.map(({ mes, dias }) => (
          <section key={mes}>
            <h4 className="mb-1.5 font-medium text-[11px] tracking-[0.08em] text-muted-foreground uppercase">
              {formatMonth(mes)}
            </h4>

            <div className="grid grid-cols-7 gap-[3px]">
              {Array.from({ length: DIAS_ANTES(dias[0] ?? `${mes}-01`) }, (_unused, index) => (
                <span key={`hueco-${String(index)}`} aria-hidden />
              ))}

              {dias.map((day) => {
                const kinds = byDate.get(day) ?? [];
                const label =
                  kinds.length === 0
                    ? formatDay(day, 'short')
                    : t('journal.calendarDay', {
                        date: formatDay(day, 'short'),
                        total: kinds.length,
                      });

                return (
                  <Link
                    key={day}
                    to={`/journal/list?from=${day}&to=${day}`}
                    title={label}
                    aria-label={label}
                    className={cn(
                      'aspect-square rounded-[3px]',
                      'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                      kinds.length === 0 && 'bg-muted',
                    )}
                    style={kinds[0] ? accentVars(ENTRY_KIND_STYLES[kinds[0]].accent) : undefined}
                  >
                    {kinds.length === 1 && (
                      <span className="block h-full w-full rounded-[3px] bg-[var(--acento)]" />
                    )}
                    {kinds.length > 1 && (
                      <span className="relative block h-full w-full overflow-hidden rounded-[3px]">
                        <span
                          className="inset-0 absolute bg-[var(--acento)]"
                          style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}
                        />
                        <span
                          className="inset-0 absolute"
                          style={{
                            ...accentVars(ENTRY_KIND_STYLES[kinds[1]].accent),
                            clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
                            backgroundColor: 'var(--acento)',
                          }}
                        />
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* La leyenda: sin ella los colores no dicen nada (Regla 3 §7). */}
      <ul className="gap-x-3 gap-y-1 flex flex-wrap">
        {ENTRY_KIND_ORDER.map((kind) => (
          <li
            key={kind}
            style={accentVars(ENTRY_KIND_STYLES[kind].accent)}
            className="gap-1.5 inline-flex items-center text-[11px] text-muted-foreground"
          >
            <span aria-hidden className="h-2 w-2 rounded-[2px] bg-[var(--acento)]" />
            {t(ENTRY_KIND_STYLES[kind].labelKey)}
          </li>
        ))}
      </ul>
    </div>
  );
}
