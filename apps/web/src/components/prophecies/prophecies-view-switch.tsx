import { CalendarRange, LayoutGrid, Route, Table2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/cn';
import { usePropheciesViewStore, type PropheciesView } from '@/lib/prophecies/view';

/** Las cuatro vistas (D11). `Route` es el trayecto: ninguno se lee como cruz. */
const VIEWS = [
    { id: 'travesia', Icon: Route, labelKey: 'prophecies.views.travesia' },
    { id: 'table', Icon: Table2, labelKey: 'prophecies.views.table' },
    { id: 'cards', Icon: LayoutGrid, labelKey: 'prophecies.views.cards' },
    { id: 'year', Icon: CalendarRange, labelKey: 'prophecies.views.year' },
] as const;

/** Elegir cómo verlo: travesía, tabla, fichas o año. Es una preferencia de quien mira, no de la URL. */
export function PropheciesViewSwitch() {
    const { t } = useTranslation();
    const view = usePropheciesViewStore((state) => state.view);
    const setView = usePropheciesViewStore((state) => state.setView);

    return (
        <div
            role="tablist"
            aria-label={t('prophecies.viewLabel')}
            className="p-0.5 gap-0.5 sm:inline-flex hidden shrink-0 rounded-lg bg-muted"
        >
            {VIEWS.map(({ id, Icon, labelKey }) => (
                <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={view === id}
                    aria-label={t(labelKey)}
                    title={t(labelKey)}
                    onClick={() => {
                        setView(id satisfies PropheciesView);
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
            ))}
        </div>
    );
}
