import { LayoutGrid, SlidersHorizontal, Table2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { BelieversFilters } from '@/components/believers/believers-filters';
import { Button } from '@/components/ui/button';
import { Drawer } from '@/components/ui/drawer';
import { SearchField } from '@/components/ui/search-field';
import { cn } from '@/lib/cn';
import { useBelieversViewStore, type BelieversView } from '@/lib/believers/view';
import type { BelieversScreen } from '@/lib/believers/use-believers-screen';

const VIEWS = [
  { id: 'table', Icon: Table2, labelKey: 'believers.viewTable' },
  { id: 'cards', Icon: LayoutGrid, labelKey: 'believers.viewCards' },
] as const;

/**
 * Buscar, filtrar y elegir cómo verlo.
 *
 * A 375 px los filtros se van a un `Drawer` con el botón «Filtros (2)», que
 * dice cuántos hay puestos (§7.7): en línea ocuparían media pantalla antes de
 * llegar al primer nombre. El conmutador de vista solo sale de `md` para
 * arriba, porque por debajo siempre son fichas (§7.4).
 */
export function BelieversToolbar({ screen }: { screen: BelieversScreen }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const view = useBelieversViewStore((state) => state.view);
  const setView = useBelieversViewStore((state) => state.setView);

  const filters = (
    <BelieversFilters
      filters={screen.filters}
      summary={screen.summary}
      congregations={screen.congregations}
      gifts={screen.gifts}
    />
  );

  return (
    <div className="gap-3 flex flex-col">
      <div className="gap-2 flex items-center">
        <SearchField
          value={screen.query.search}
          onChange={screen.query.setSearch}
          label={t('believers.search')}
          className="min-w-0 flex-1"
        />

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
            ? t('believers.filtersWithCount', { count: screen.filters.count })
            : t('believers.filters')}
        </Button>

        <div
          role="tablist"
          aria-label={t('believers.viewLabel')}
          className="p-0.5 gap-0.5 md:inline-flex hidden shrink-0 rounded-lg bg-muted"
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
                setView(id satisfies BelieversView);
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
        title={t('believers.filters')}
        onClose={() => {
          setOpen(false);
        }}
      >
        <div className="gap-4 p-4 flex flex-col">
          {filters}
          {screen.filters.count > 0 && (
            <Button variant="ghost" size="md" onClick={screen.filters.clear}>
              {t('believers.clearFilters')}
            </Button>
          )}
        </div>
      </Drawer>
    </div>
  );
}
