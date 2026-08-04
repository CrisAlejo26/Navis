import type { BelieverListItem } from '@navis/shared';
import { UserSearch } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { BelieverCard } from '@/components/believers/believer-card';
import type { BelieverCells } from '@/components/believers/believer-row';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import type { BelieversScreen } from '@/lib/believers/use-believers-screen';

/** Se paran a las doce: más allá, la cascada solo hace esperar (§7.8). */
const ESCALON = 12;

/**
 * El listado como rejilla de fichas: una columna en el teléfono, dos en tablet
 * y tres a partir de `xl` (§7.4).
 *
 * Comparten `Pagination` y las mismas acciones con la tabla; lo único distinto
 * es la forma, que es justo lo que se está eligiendo.
 */
export function BelieversCards({
  screen,
  cells,
  toolbar,
}: {
  screen: BelieversScreen;
  cells: (believer: BelieverListItem, index: number) => BelieverCells;
  toolbar: ReactNode;
}) {
  const { t } = useTranslation();
  const items = screen.page?.items;

  return (
    <div className="gap-4 flex flex-col">
      {toolbar}

      {screen.isLoading && (
        <div className="gap-4 sm:grid-cols-2 xl:grid-cols-3 grid">
          {Array.from({ length: 6 }, (_unused, index) => (
            <Skeleton key={index} className="h-36 w-full rounded-xl" />
          ))}
        </div>
      )}

      {!screen.isLoading && items?.length === 0 && (
        <div className="rounded-xl border bg-card">
          <EmptyState
            icon={UserSearch}
            title={screen.filters.count > 0 ? t('believers.noResults') : t('believers.empty')}
          >
            {screen.filters.count > 0 ? t('believers.noResultsHint') : t('believers.emptyHint')}
          </EmptyState>
        </div>
      )}

      {!screen.isLoading && items && items.length > 0 && (
        <ul className="gap-4 sm:grid-cols-2 xl:grid-cols-3 grid">
          {items.map((believer, index) => (
            <li
              key={believer.id}
              // `both` en la animación ya sostiene el estado inicial durante el
              // retardo, así que no hace falta esconderla a mano.
              className="animate-page-in"
              style={{ animationDelay: `${String(Math.min(index, ESCALON) * 40)}ms` }}
            >
              <BelieverCard {...cells(believer, index)} />
            </li>
          ))}
        </ul>
      )}

      {screen.page && (
        <div className="overflow-hidden rounded-xl border bg-card">
          <Pagination
            page={screen.page.page}
            limit={screen.page.limit}
            total={screen.page.total}
            totalPages={screen.page.totalPages}
            onPageChange={screen.query.setPage}
            onLimitChange={screen.query.setLimit}
          />
        </div>
      )}
    </div>
  );
}
