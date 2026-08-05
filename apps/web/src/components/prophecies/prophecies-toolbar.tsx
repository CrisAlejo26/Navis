import { CalendarRange, LayoutGrid, Route, SlidersHorizontal, Table2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PropheciesFilters } from '@/components/prophecies/prophecies-filters';
import { Button } from '@/components/ui/button';
import { ClearFiltersButton } from '@/components/ui/clear-filters-button';
import { Drawer } from '@/components/ui/drawer';
import { SearchField } from '@/components/ui/search-field';
import { cn } from '@/lib/cn';
import type { PropheciesScreen } from '@/lib/prophecies/use-prophecies-screen';
import { usePropheciesViewStore, type PropheciesView } from '@/lib/prophecies/view';

/** Las cuatro vistas (D11). `Route` es el trayecto: ninguno se lee como cruz. */
const VIEWS = [
  { id: 'travesia', Icon: Route, labelKey: 'prophecies.views.travesia' },
  { id: 'table', Icon: Table2, labelKey: 'prophecies.views.table' },
  { id: 'cards', Icon: LayoutGrid, labelKey: 'prophecies.views.cards' },
  { id: 'year', Icon: CalendarRange, labelKey: 'prophecies.views.year' },
] as const;

/**
 * Buscar, filtrar y elegir cómo verlo.
 *
 * A 375 px los filtros se van a un `Drawer` con el botón «Filtros (2)», que
 * dice cuántos hay puestos (§7.9): en línea ocuparían media pantalla antes de
 * llegar a la primera palabra.
 */
export function PropheciesToolbar({ screen }: { screen: PropheciesScreen }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const view = usePropheciesViewStore((state) => state.view);
  const setView = usePropheciesViewStore((state) => state.setView);

  const filters = <PropheciesFilters filters={screen.filters} stats={screen.stats} />;

  return (
    <div className="gap-3 flex flex-col">
      <div className="gap-2 flex items-center">
        <SearchField
          value={screen.query.search}
          onChange={screen.query.setSearch}
          label={t('prophecies.search')}
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
            ? t('prophecies.filtersTotal', { total: screen.filters.count })
            : t('prophecies.filters')}
        </Button>

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
      </div>

      <div className="lg:block hidden">{filters}</div>

      <Drawer
        open={open}
        side="right"
        width="min(22rem, 90vw)"
        title={t('prophecies.filters')}
        onClose={() => {
          setOpen(false);
        }}
      >
        {/* El botón de quitar filtros lo trae ya `PropheciesFilters`: tenerlo
            también aquí eran dos botones que hacen lo mismo. */}
        <div className="p-4">{filters}</div>
      </Drawer>
    </div>
  );
}
