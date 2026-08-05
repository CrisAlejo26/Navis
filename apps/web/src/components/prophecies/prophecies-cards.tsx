import type { ProphecyListItem } from '@navis/shared';
import { Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { ProphecyCard } from '@/components/prophecies/prophecy-card';
import type { ProphecyCells } from '@/components/prophecies/prophecy-row';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import type { PropheciesScreen } from '@/lib/prophecies/use-prophecies-screen';

/**
 * El listado como rejilla de fichas: una columna en móvil, dos en tablet y tres
 * en escritorio (Regla 5 §3).
 *
 * Para leer varias palabras en paralelo, que es lo que no deja hacer una tabla.
 */
export function PropheciesCards({
  screen,
  cells,
  toolbar,
}: {
  screen: PropheciesScreen;
  cells: (prophecy: ProphecyListItem, index: number) => ProphecyCells;
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
          icon={Sparkles}
          title={
            screen.filters.count > 0 || screen.query.search
              ? t('prophecies.noResults')
              : t('prophecies.emptyTitle')
          }
        />
      )}

      {!screen.isLoading && items.length > 0 && (
        <ul className="gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3 grid">
          {items.map((prophecy, index) => (
            <li
              key={prophecy.id}
              // Entrada escalonada, y solo las doce primeras: más allá, la
              // cascada solo hace esperar (§7.8).
              style={{ animationDelay: `${String(Math.min(index, 12) * 40)}ms` }}
              className="p-4 animate-rise-in rounded-lg border transition-colors duration-200 hover:border-foreground/25"
            >
              <ProphecyCard {...cells(prophecy, index)} />
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
