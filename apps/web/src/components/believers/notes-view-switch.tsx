import { CalendarDays, LayoutGrid, List, ScrollText, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/cn';
import { NOTES_VIEWS, type NotesView } from '@/lib/believers/note-view';

/** Cada vista con su icono. Ninguno se lee como una cruz (Regla 7 §6). */
const VIEWS: Record<NotesView, { Icon: LucideIcon; labelKey: string }> = {
  log: { Icon: ScrollText, labelKey: 'notes.viewLog' },
  list: { Icon: List, labelKey: 'notes.viewList' },
  cards: { Icon: LayoutGrid, labelKey: 'notes.viewCards' },
  calendar: { Icon: CalendarDays, labelKey: 'notes.viewCalendar' },
};

/**
 * Las cuatro maneras de mirar la misma bitácora.
 *
 * El texto se esconde en pantallas estrechas, pero el icono nunca va solo:
 * conserva su etiqueta accesible (Reglas 2 y 5).
 */
export function NotesViewSwitch({
  view,
  onChange,
}: {
  view: NotesView;
  onChange: (view: NotesView) => void;
}) {
  const { t } = useTranslation();

  return (
    <div
      role="tablist"
      aria-label={t('notes.viewLabel')}
      className="p-0.5 gap-0.5 inline-flex shrink-0 rounded-lg bg-muted"
    >
      {NOTES_VIEWS.map((key) => {
        const { Icon, labelKey } = VIEWS[key];
        const active = key === view;

        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={t(labelKey)}
            title={t(labelKey)}
            onClick={() => {
              onChange(key);
            }}
            className={cn(
              'h-9 gap-1.5 px-2.5 text-sm inline-flex cursor-pointer items-center rounded-md',
              'transition-[background-color,color] duration-200',
              'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
              active
                ? 'shadow-sm font-medium bg-card text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon size={15} aria-hidden />
            <span className="lg:not-sr-only sr-only">{t(labelKey)}</span>
          </button>
        );
      })}
    </div>
  );
}
