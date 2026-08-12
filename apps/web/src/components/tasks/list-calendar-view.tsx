import { addMonths, eachDay, monthGrid, startOfMonth, todayIn } from '@navis/shared';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { accentColor } from '@/lib/accents';
import { cn } from '@/lib/cn';
import { formatDay, formatWeekday } from '@/lib/format';
import { itemFields, type ListItem } from '@/lib/tasks/use-list-screen';

/**
 * La vista de calendario del Listado (RFC 0018 §9.5): un punto por
 * tarea/hábito, coloreado por su primera etiqueta — mismo espíritu que la
 * cinta de fases del calendario de reuniones (RFC 0002 D20), en su propia
 * cuadrícula: aquí no hay sedes ni patrones que reutilizar.
 */
export function ListCalendarView({
  items,
  onOpen,
}: {
  items: ListItem[];
  onOpen: (item: ListItem) => void;
}) {
  const { t } = useTranslation();
  const today = todayIn(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [month, setMonth] = useState(() => startOfMonth(today));

  const grid = useMemo(() => monthGrid(month), [month]);
  const days = useMemo(() => eachDay(grid.from, grid.to), [grid]);
  const byDay = useMemo(() => {
    const map = new Map<string, ListItem[]>();
    for (const item of items) {
      const date = itemFields(item).date;
      map.set(date, [...(map.get(date) ?? []), item]);
    }
    return map;
  }, [items]);

  return (
    <div className="gap-3 flex flex-col">
      <div className="gap-2 flex items-center justify-center">
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('common.previous')}
          onClick={() => {
            setMonth((current) => addMonths(current, -1));
          }}
        >
          <ChevronLeft size={16} aria-hidden />
        </Button>
        <p className="w-40 text-sm font-medium text-center capitalize">
          {formatDay(month, 'medium').replace(/^\d+\s*/, '')}
        </p>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('common.next')}
          onClick={() => {
            setMonth((current) => addMonths(current, 1));
          }}
        >
          <ChevronRight size={16} aria-hidden />
        </Button>
      </div>

      <div className="gap-1 font-medium grid grid-cols-7 text-center text-[11px] text-muted-foreground">
        {Array.from({ length: 7 }, (_, index) => (
          <span key={index}>{formatWeekday((index + 1) % 7).slice(0, 2)}</span>
        ))}
      </div>

      <div className="gap-1 grid grid-cols-7">
        {days.map((date) => {
          const dayItems = byDay.get(date) ?? [];
          const inMonth = date.slice(0, 7) === month.slice(0, 7);

          return (
            <button
              key={date}
              type="button"
              disabled={dayItems.length === 0}
              onClick={() => {
                const first = dayItems[0];
                if (first) onOpen(first);
              }}
              className={cn(
                'p-1 gap-1 text-xs flex aspect-square flex-col items-center rounded-lg border',
                date === today && 'border-primary',
                !inMonth && 'opacity-35',
                dayItems.length === 0 ? 'cursor-default' : 'cursor-pointer hover:bg-muted',
              )}
            >
              <span className="tabular-nums">{Number(date.slice(8, 10))}</span>
              <span className="gap-0.5 flex flex-wrap items-center justify-center">
                {dayItems.slice(0, 4).map((item) => {
                  const fields = itemFields(item);
                  return (
                    <span
                      key={fields.id + item.kind}
                      aria-hidden
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: accentColor(fields.tags[0]?.accent ?? 'primary') }}
                    />
                  );
                })}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
