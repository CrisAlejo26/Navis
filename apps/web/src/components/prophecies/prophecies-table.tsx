import type { ProphecyListItem, ProphecySortField } from '@navis/shared';
import { Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { ProphecyCard } from '@/components/prophecies/prophecy-card';
import { ProphecyRow, type ProphecyCells } from '@/components/prophecies/prophecy-row';
import { DataTable } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';
import { TableHeader } from '@/components/ui/table';
import type { PropheciesScreen } from '@/lib/prophecies/use-prophecies-screen';

/**
 * El listado como tabla, sobre el `DataTable` de siempre —que ya hace tabla
 * arriba y lista de fichas abajo (Regla 5 §2, RFC 0004 D15)—.
 *
 * Se reutiliza tal cual y no se copia: ya trae esqueleto de carga, estado
 * vacío, estado de error con reintento y el cambio de forma por ancho.
 */
export function PropheciesTable({
  screen,
  cells,
  toolbar,
}: {
  screen: PropheciesScreen;
  cells: (prophecy: ProphecyListItem, index: number) => ProphecyCells;
  toolbar: ReactNode;
}) {
  const { t } = useTranslation();

  const sortable = (field: ProphecySortField, label: string) => (
    <TableHeader
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
      columnCount={6}
      getKey={(prophecy) => prophecy.id}
      emptyIcon={Sparkles}
      emptyTitle={
        screen.filters.count > 0 || screen.query.search
          ? t('prophecies.noResults')
          : t('prophecies.emptyTitle')
      }
      toolbar={toolbar}
      // Las filas entran escalonadas, y solo las doce primeras: más allá, la
      // cascada solo hace esperar (§7.8).
      rowClassName={() => 'animate-rise-in'}
      rowStyle={(_prophecy, index) => ({
        animationDelay: `${String(Math.min(index, 12) * 35)}ms`,
      })}
      columns={
        <>
          {sortable('title', t('prophecies.columns.title'))}
          {sortable('received', t('prophecies.columns.received'))}
          <TableHeader>{t('prophecies.columns.state')}</TableHeader>
          <TableHeader className="lg:table-cell hidden">
            {t('prophecies.columns.fulfillments')}
          </TableHeader>
          {sortable('fulfilled', t('prophecies.columns.waiting'))}
          <TableHeader className="text-right">
            <span className="sr-only">{t('common.actions')}</span>
          </TableHeader>
        </>
      }
      renderRow={(prophecy, index) => <ProphecyRow {...cells(prophecy, index)} />}
      renderCard={(prophecy, index) => <ProphecyCard {...cells(prophecy, index)} />}
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
