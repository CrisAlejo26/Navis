import type { BelieverListItem, BelieverSortField } from '@navis/shared';
import { UserSearch } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { BelieverCard } from '@/components/believers/believer-card';
import { BelieverRow, type BelieverCells } from '@/components/believers/believer-row';
import { DataTable } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';
import { TableHeader } from '@/components/ui/table';
import type { BelieversScreen } from '@/lib/believers/use-believers-screen';

/**
 * El listado como tabla, sobre el `DataTable` de siempre —que ya hace tabla
 * arriba y lista de fichas abajo (Regla 5 §2)—.
 *
 * Las cabeceras se escriben a mano y no con `SortableColumns` porque aquí se
 * alternan columnas ordenables y columnas que no lo son: los dones no se
 * ordenan, y la sonda sí —es la que más se ordena, porque «quién lleva más sin
 * que le escriban» es la pregunta de la pantalla (§6.1)—.
 *
 * La sede no sale como columna (a petición): con una sola congregación en la
 * iglesia, la columna era la misma celda repetida en cada fila. Sigue siendo
 * un filtro («Todas las sedes») y se ve en la ficha de cada persona.
 */
export function BelieversTable({
  screen,
  cells,
  toolbar,
  allSelected,
  onToggleAll,
}: {
  screen: BelieversScreen;
  cells: (believer: BelieverListItem, index: number) => BelieverCells;
  toolbar: ReactNode;
  allSelected: boolean;
  onToggleAll: () => void;
}) {
  const { t } = useTranslation();

  const sortable = (field: BelieverSortField, label: string) => (
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

  // La columna de fotografía solo existe si alguien de esta página tiene una:
  // una columna vacía para diecinueve de veinte roba ancho a lo que sí se lee.
  const showPhoto = (screen.page?.items ?? []).some((believer) => believer.hasPhoto);

  return (
    <DataTable
      items={screen.page?.items}
      isLoading={screen.isLoading}
      isError={screen.isError}
      onRetry={screen.refetch}
      columnCount={(screen.canManage ? 7 : 6) + (showPhoto ? 1 : 0)}
      getKey={(believer) => believer.id}
      emptyIcon={UserSearch}
      emptyTitle={screen.filters.count > 0 ? t('believers.noResults') : t('believers.empty')}
      toolbar={toolbar}
      rowClassName={(believer) =>
        believer.needsAttention ? 'border-l-destructive hover:border-l-destructive' : undefined
      }
      columns={
        <>
          {screen.canManage && (
            <TableHeader className="w-0 pr-0">
              <input
                type="checkbox"
                checked={allSelected}
                aria-label={t('believers.selectAll')}
                onChange={onToggleAll}
                className="h-4 w-4 rounded cursor-pointer accent-primary focus-visible:ring-2 focus-visible:ring-ring"
              />
            </TableHeader>
          )}
          {showPhoto && (
            <TableHeader className="w-11 pr-0">
              <span className="sr-only">{t('believers.photo')}</span>
            </TableHeader>
          )}
          {sortable('name', t('believers.columnName'))}
          {sortable('status', t('believers.columnStatus'))}
          <TableHeader className="lg:table-cell hidden">{t('believers.columnGifts')}</TableHeader>
          <TableHeader className="xl:table-cell hidden">{t('ministries.title')}</TableHeader>
          {sortable('lastNote', t('believers.columnAlert'))}
          <TableHeader className="text-right">
            <span className="sr-only">{t('common.actions')}</span>
          </TableHeader>
        </>
      }
      renderRow={(believer, index) => (
        <BelieverRow {...cells(believer, index)} showPhoto={showPhoto} />
      )}
      renderCard={(believer, index) => <BelieverCard {...cells(believer, index)} />}
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
