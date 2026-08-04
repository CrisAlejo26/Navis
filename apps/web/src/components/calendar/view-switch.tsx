import { CalendarDays, CalendarRange, LayoutGrid, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { CALENDAR_VIEWS, type CalendarView } from '@/lib/calendar/view-range';
import { cn } from '@/lib/cn';

/** Cada vista con su icono y su atajo. Ninguno es una cruz (Regla 7). */
const VIEWS: Record<CalendarView, { Icon: LucideIcon; labelKey: string; shortcut: string }> = {
  month: { Icon: LayoutGrid, labelKey: 'calendar.viewMonth', shortcut: 'M' },
  week: { Icon: CalendarRange, labelKey: 'calendar.viewWeek', shortcut: 'S' },
  agenda: { Icon: CalendarDays, labelKey: 'calendar.viewAgenda', shortcut: 'A' },
  people: { Icon: Users, labelKey: 'calendar.viewPeople', shortcut: 'P' },
};

/**
 * Las cuatro maneras de mirar lo mismo. El texto se esconde en pantallas
 * estrechas, pero el icono nunca va solo: conserva su etiqueta accesible
 * (Reglas 2 y 5).
 */
export function ViewSwitch({
  view,
  onChange,
}: {
  view: CalendarView;
  onChange: (view: CalendarView) => void;
}) {
  const { t } = useTranslation();

  return (
    <div
      role="tablist"
      aria-label={t('calendar.title')}
      className="p-0.5 gap-0.5 inline-flex rounded-lg bg-muted"
    >
      {CALENDAR_VIEWS.map((key) => {
        const { Icon, labelKey, shortcut } = VIEWS[key];
        const active = key === view;

        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={active}
            title={`${t(labelKey)} · ${shortcut}`}
            onClick={() => {
              onChange(key);
            }}
            className={cn(
              'h-8 gap-1.5 px-2.5 text-sm inline-flex cursor-pointer items-center rounded-md',
              'transition-[background-color,color] duration-200',
              'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
              active
                ? 'font-medium shadow-sm bg-card text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon size={15} aria-hidden />
            <span className="sm:not-sr-only sr-only">{t(labelKey)}</span>
          </button>
        );
      })}
    </div>
  );
}
