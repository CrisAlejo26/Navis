import type { TeachingListItem, TeachingSortField } from '@navis/shared';
import { GraduationCap } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { TeachingListCard } from '@/components/teachings/teaching-list-card';
import { TeachingRow, type TeachingCells } from '@/components/teachings/teaching-row';
import { DataTable } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';
import { TableHeader } from '@/components/ui/table';
import type { TeachingsScreen } from '@/lib/teachings/use-teachings-screen';

/** El listado como tabla, sobre el `DataTable` de siempre (Regla 5, Regla 1). */
export function TeachingsTable({
  screen,
  cells,
  toolbar,
}: {
  screen: TeachingsScreen;
  cells: (teaching: TeachingListItem, index: number) => TeachingCells;
  toolbar: ReactNode;
}) {
  const { t } = useTranslation();

  const sortable = (field: TeachingSortField, label: string) => (
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
      columnCount={4}
      getKey={(teaching) => teaching.id}
      emptyIcon={GraduationCap}
      emptyTitle={screen.query.search ? t('teachings.noResults') : t('teachings.emptyTitle')}
      toolbar={toolbar}
      rowClassName={() => 'animate-rise-in'}
      rowStyle={(_teaching, index) => ({
        animationDelay: `${String(Math.min(index, 12) * 35)}ms`,
      })}
      columns={
        <>
          {sortable('title', t('teachings.columns.title'))}
          {sortable('received', t('teachings.columns.received'))}
          <TableHeader>{t('teachings.columns.checklist')}</TableHeader>
          <TableHeader className="text-right">
            <span className="sr-only">{t('common.actions')}</span>
          </TableHeader>
        </>
      }
      renderRow={(teaching, index) => <TeachingRow {...cells(teaching, index)} />}
      renderCard={(teaching, index) => <TeachingListCard {...cells(teaching, index)} />}
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
