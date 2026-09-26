import { CalendarRange, LayoutGrid, Table2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/cn';
import { JOURNAL_VIEWS, useJournalViewStore, type JournalView } from '@/lib/journal/view';

/** Las tres vistas (D9). Ningún icono se lee como cruz (Regla 7 §6). */
const VIEW_ICON: Record<JournalView, typeof LayoutGrid> = {
    cards: LayoutGrid,
    table: Table2,
    calendar: CalendarRange,
};

/** Elegir cómo verlo: fichas, tabla o calendario. Es una preferencia de quien mira, no de la URL. */
export function JournalViewSwitch() {
    const { t } = useTranslation();
    const view = useJournalViewStore((state) => state.view);
    const setView = useJournalViewStore((state) => state.setView);

    return (
        <div
            role="tablist"
            aria-label={t('journal.viewLabel')}
            className="p-0.5 gap-0.5 sm:inline-flex hidden shrink-0 rounded-lg bg-muted"
        >
            {JOURNAL_VIEWS.map((id) => {
                const Icon = VIEW_ICON[id];
                const label = t(`journal.views.${id}`);

                return (
                    <button
                        key={id}
                        type="button"
                        role="tab"
                        aria-selected={view === id}
                        aria-label={label}
                        title={label}
                        onClick={() => {
                            setView(id);
                        }}
                        className={cn(
                            'h-9 w-9 inline-flex cursor-pointer items-center justify-center rounded-md',
                            'transition-[background-color,color] duration-200',
                            'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                            view === id
                                ? 'shadow-sm bg-card text-foreground'
                                : 'text-muted-foreground hover:text-foreground',
                        )}
                    >
                        <Icon size={16} aria-hidden />
                    </button>
                );
            })}
        </div>
    );
}
