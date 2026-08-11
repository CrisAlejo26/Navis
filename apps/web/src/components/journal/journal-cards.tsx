import type { JournalEntryListItem } from '@navis/shared';
import { NotebookPen } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { EntryCard } from '@/components/journal/entry-card';
import type { EntryCells } from '@/components/journal/entry-row';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import type { JournalScreen } from '@/lib/journal/use-journal-screen';

/**
 * El listado como rejilla de fichas: la vista de serie del cuaderno (D9),
 * donde más se nota el color de cada tipo (D15).
 */
export function JournalCards({
  screen,
  cells,
  toolbar,
}: {
  screen: JournalScreen;
  cells: (entry: JournalEntryListItem, index: number) => EntryCells;
  toolbar: ReactNode;
}) {
  const { t } = useTranslation();
  const items = screen.page?.items ?? [];

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="p-3 border-b">{toolbar}</div>

      {screen.isLoading && (
        <div className="gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3 grid">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="gap-2 p-4 flex flex-col rounded-lg border">
              <Skeleton className="w-40" />
              <Skeleton className="w-full" />
              <Skeleton className="w-24" />
            </div>
          ))}
        </div>
      )}

      {!screen.isLoading && items.length === 0 && (
        <EmptyState
          icon={NotebookPen}
          title={
            screen.filters.count > 0 || screen.query.search
              ? t('journal.noResults')
              : t('journal.emptyTitle')
          }
        />
      )}

      {!screen.isLoading && items.length > 0 && (
        <ul className="gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3 grid">
          {items.map((entry, index) => (
            <li
              key={entry.id}
              style={{ animationDelay: `${String(Math.min(index, 12) * 40)}ms` }}
              className="p-4 animate-rise-in rounded-lg border transition-colors duration-200 hover:border-foreground/25"
            >
              <EntryCard {...cells(entry, index)} />
            </li>
          ))}
        </ul>
      )}

      {screen.page && (
        <Pagination
          page={screen.page.page}
          limit={screen.page.limit}
          total={screen.page.total}
          totalPages={screen.page.totalPages}
          onPageChange={screen.query.setPage}
          onLimitChange={screen.query.setLimit}
        />
      )}
    </div>
  );
}
