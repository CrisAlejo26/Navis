import type { JournalEntryListItem, JournalSortField } from '@navis/shared';
import { NotebookPen } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { EntryCard } from '@/components/journal/entry-card';
import { EntryRow, type EntryCells } from '@/components/journal/entry-row';
import { DataTable } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';
import { TableHeader } from '@/components/ui/table';
import type { JournalScreen } from '@/lib/journal/use-journal-screen';

/**
 * El listado como tabla, sobre el `DataTable` de siempre —tabla arriba, ficha
 * abajo, ya con esqueleto, vacío y error con reintento (Regla 5 §2)—.
 */
export function JournalTable({
  screen,
  cells,
  toolbar,
}: {
  screen: JournalScreen;
  cells: (entry: JournalEntryListItem, index: number) => EntryCells;
  toolbar: ReactNode;
}) {
  const { t } = useTranslation();

  const sortable = (field: JournalSortField, label: string) => (
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
      columnCount={7}
      getKey={(entry) => entry.id}
      emptyIcon={NotebookPen}
      emptyTitle={
        screen.filters.count > 0 || screen.query.search
          ? t('journal.noResults')
          : t('journal.emptyTitle')
      }
      toolbar={toolbar}
      rowClassName={() => 'animate-rise-in'}
      rowStyle={(_entry, index) => ({ animationDelay: `${String(Math.min(index, 12) * 35)}ms` })}
      columns={
        <>
          {/* Sin rótulo: cada casilla ya lleva su propia etiqueta accesible
              con el título de la entrada. */}
          <TableHeader className="w-10" />
          {sortable('title', t('journal.columns.title'))}
          {sortable('kind', t('journal.columns.kind'))}
          {sortable('date', t('journal.columns.date'))}
          <TableHeader>{t('journal.columns.reminder')}</TableHeader>
          <TableHeader className="lg:table-cell hidden">{t('journal.columns.author')}</TableHeader>
          <TableHeader className="text-right">
            <span className="sr-only">{t('common.actions')}</span>
          </TableHeader>
        </>
      }
      renderRow={(entry, index) => <EntryRow {...cells(entry, index)} />}
      renderCard={(entry, index) => <EntryCard {...cells(entry, index)} />}
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
