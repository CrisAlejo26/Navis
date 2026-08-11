import { CalendarRange, LayoutGrid, SlidersHorizontal, Table2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { JournalFilters } from '@/components/journal/journal-filters';
import { Button } from '@/components/ui/button';
import { ClearFiltersButton } from '@/components/ui/clear-filters-button';
import { Drawer } from '@/components/ui/drawer';
import { SearchField } from '@/components/ui/search-field';
import { cn } from '@/lib/cn';
import { JOURNAL_VIEWS, useJournalViewStore, type JournalView } from '@/lib/journal/view';
import type { JournalScreen } from '@/lib/journal/use-journal-screen';

/** Las tres vistas (D9). Ningún icono se lee como cruz (Regla 7 §6). */
const VIEW_ICON: Record<JournalView, typeof LayoutGrid> = {
  cards: LayoutGrid,
  table: Table2,
  calendar: CalendarRange,
};

/**
 * Buscar, filtrar y elegir cómo verlo.
 *
 * A 375 px los filtros se van a un `Drawer` con el botón «Filtros (2)», que
 * dice cuántos hay puestos (§7.4): en línea ocuparían media pantalla antes de
 * llegar a la primera palabra.
 */
export function JournalToolbar({ screen }: { screen: JournalScreen }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const view = useJournalViewStore((state) => state.view);
  const setView = useJournalViewStore((state) => state.setView);

  const filters = <JournalFilters filters={screen.filters} stats={screen.stats} />;

  return (
    <div className="gap-3 flex flex-col">
      <div className="gap-2 flex items-center">
        <SearchField
          value={screen.query.search}
          onChange={screen.query.setSearch}
          label={t('journal.search')}
          className="min-w-0 flex-1"
        />

        <ClearFiltersButton count={screen.filters.count} onClear={screen.filters.clear} />

        <Button
          variant="secondary"
          size="md"
          className="lg:hidden shrink-0"
          onClick={() => {
            setOpen(true);
          }}
        >
          <SlidersHorizontal size={16} aria-hidden />
          {screen.filters.count > 0
            ? t('journal.filtersTotal', { total: screen.filters.count })
            : t('journal.filters')}
        </Button>

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
      </div>

      <div className="lg:block hidden">{filters}</div>

      <Drawer
        open={open}
        side="right"
        width="min(22rem, 90vw)"
        title={t('journal.filters')}
        onClose={() => {
          setOpen(false);
        }}
      >
        <div className="p-4">{filters}</div>
      </Drawer>
    </div>
  );
}
