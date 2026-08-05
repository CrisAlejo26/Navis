import { SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DreamsFilters } from '@/components/dreams/dreams-filters';
import { Button } from '@/components/ui/button';
import { ClearFiltersButton } from '@/components/ui/clear-filters-button';
import { Drawer } from '@/components/ui/drawer';
import { SearchField } from '@/components/ui/search-field';
import type { DreamsScreen } from '@/lib/dreams/use-dreams-screen';

/**
 * Buscar y filtrar.
 *
 * Sin selector de vistas, al revés que profecías: allí hay cuatro formas de
 * mirar lo mismo porque la pregunta es «¿qué ha pasado con esto?». Aquí la
 * pregunta es «¿qué soñé y cuándo?», y para eso la tabla y las fichas del
 * `DataTable` llegan. Una barra de vistas que nadie necesita es mobiliario.
 *
 * A 375 px los filtros se van a un `Drawer` con el botón «Filtros (2)», que
 * dice cuántos hay puestos: en línea ocuparían media pantalla antes de llegar
 * al primer sueño.
 */
export function DreamsToolbar({ screen }: { screen: DreamsScreen }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const filters = <DreamsFilters filters={screen.filters} emotions={screen.emotions} />;

  return (
    <div className="gap-3 flex flex-col">
      <div className="gap-2 flex items-center">
        <SearchField
          value={screen.query.search}
          onChange={screen.query.setSearch}
          label={t('dreams.search')}
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
            ? t('dreams.filtersTotal', { total: screen.filters.count })
            : t('dreams.filters')}
        </Button>
      </div>

      <div className="lg:block hidden">{filters}</div>

      <Drawer
        open={open}
        side="right"
        width="min(22rem, 90vw)"
        title={t('dreams.filters')}
        onClose={() => {
          setOpen(false);
        }}
      >
        {/* El botón de quitar filtros lo trae ya `DreamsFilters`: tenerlo
            también aquí eran dos botones que hacen lo mismo. */}
        <div className="p-4">{filters}</div>
      </Drawer>
    </div>
  );
}
