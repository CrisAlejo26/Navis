import { Download, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { BelieversFilters } from '@/components/believers/believers-filters';
import { BelieversViewSwitch } from '@/components/believers/believers-view-switch';
import { Button } from '@/components/ui/button';
import { Drawer } from '@/components/ui/drawer';
import { SearchField } from '@/components/ui/search-field';
import type { BelieversScreen } from '@/lib/believers/use-believers-screen';

/**
 * Buscar, filtrar, exportar y elegir cómo verlo.
 *
 * A 375 px los filtros se van a un `Drawer` con el botón «Filtros (2)», que
 * dice cuántos hay puestos (RFC 0003 §7.7): en línea ocuparían media pantalla
 * antes de llegar al primer nombre.
 */
export function BelieversToolbar({
  screen,
  onExport,
}: {
  screen: BelieversScreen;
  onExport: () => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

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

        {/* No es la acción principal de esta pantalla —lo es «Añadir»— así que
            va en secundario y sin rótulo en pantallas estrechas (RFC 0009 §7.1). */}
        <Button
          variant="secondary"
          size="md"
          className="shrink-0"
          aria-label={t('export.title')}
          onClick={onExport}
        >
          <Download size={16} aria-hidden />
          <span className="sm:inline hidden">{t('export.title')}</span>
        </Button>

        <BelieversViewSwitch />
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
