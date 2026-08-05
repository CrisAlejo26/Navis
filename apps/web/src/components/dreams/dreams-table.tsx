import type { DreamListItem, DreamSortField } from '@navis/shared';
import { MoonStar } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { DreamCard } from '@/components/dreams/dream-card';
import { DreamRow, type DreamCells } from '@/components/dreams/dream-row';
import { DataTable } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';
import { TableHeader } from '@/components/ui/table';
import type { DreamsScreen } from '@/lib/dreams/use-dreams-screen';

/**
 * El listado, sobre el `DataTable` de siempre —que ya hace tabla arriba y lista
 * de fichas abajo (Regla 5 §2)—.
 *
 * Se reutiliza tal cual y no se copia: ya trae esqueleto de carga, estado
 * vacío, estado de error con reintento y el cambio de forma por ancho.
 */
export function DreamsTable({
  screen,
  cells,
  toolbar,
}: {
  screen: DreamsScreen;
  cells: (dream: DreamListItem, index: number) => DreamCells;
  toolbar: ReactNode;
}) {
  const { t } = useTranslation();

  const sortable = (field: DreamSortField, label: string, className?: string) => (
    <TableHeader
      className={className}
      sorted={screen.query.sort === field && screen.query.order}
      sortLabel={t('roles.sortBy', { column: label })}
      onSort={() => {
        screen.query.toggleSort(field);
      }}
    >
      {label}
    </TableHeader>
  );

  return (
    <DataTable
      items={screen.page?.items}
      isLoading={screen.isLoading}
      isError={screen.isError}
      onRetry={screen.refetch}
      columnCount={5}
      getKey={(dream) => dream.id}
      emptyIcon={MoonStar}
      emptyTitle={
        screen.filters.count > 0 || screen.query.search
          ? t('dreams.noResults')
          : t('dreams.emptyTitle')
      }
      toolbar={toolbar}
      // Las filas entran escalonadas, y solo las doce primeras: más allá, la
      // cascada solo hace esperar (§7.8).
      rowClassName={() => 'animate-rise-in'}
      rowStyle={(_dream, index) => ({
        animationDelay: `${String(Math.min(index, 12) * 35)}ms`,
      })}
      columns={
        <>
          {/* `w-px` con el contenido sin partir: la columna se encoge a lo que
              ocupa la fecha en vez de repartirse el ancho a partes iguales. */}
          {sortable('dreamed', t('dreams.columns.dreamed'), 'w-px whitespace-nowrap')}
          {sortable('title', t('dreams.columns.dream'))}
          <TableHeader className="lg:table-cell hidden">{t('dreams.columns.emotions')}</TableHeader>
          <TableHeader>{t('dreams.columns.state')}</TableHeader>
          <TableHeader className="text-right">
            <span className="sr-only">{t('common.actions')}</span>
          </TableHeader>
        </>
      }
      renderRow={(dream, index) => <DreamRow {...cells(dream, index)} />}
      renderCard={(dream, index) => <DreamCard {...cells(dream, index)} />}
      footer={
        screen.page && (
          <Pagination
            page={screen.page.page}
            limit={screen.page.limit}
            total={screen.page.total}
            totalPages={screen.page.totalPages}
            onPageChange={screen.query.setPage}
            onLimitChange={screen.query.setLimit}
          />
        )
      }
    />
  );
}
