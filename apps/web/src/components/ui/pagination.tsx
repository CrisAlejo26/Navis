import { PAGE_SIZES } from '@navis/shared';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';

interface PaginationProps {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

/**
 * Pie de tabla: cuántos elementos se están viendo, cuántos hay y con qué
 * tamaño de página. La paginación es del servidor —solo viaja la página que se
 * mira—, así que esto solo mueve los números de la consulta.
 */
export function Pagination({
  page,
  limit,
  total,
  totalPages,
  onPageChange,
  onLimitChange,
}: PaginationProps) {
  const { t } = useTranslation();
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="gap-4 px-4 py-3 sm:flex-row sm:items-center sm:justify-between flex flex-col border-t">
      <p className="text-xs text-muted-foreground tabular-nums">
        {t('roles.showing', { from, to, total })}
      </p>

      <div className="gap-3 sm:justify-end flex items-center justify-between">
        <label className="gap-2 text-xs flex items-center text-muted-foreground">
          {t('roles.perPage')}
          <Select
            size="sm"
            value={limit}
            aria-label={t('roles.perPage')}
            onChange={(event) => {
              onLimitChange(Number(event.target.value));
            }}
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </Select>
        </label>

        <div className="gap-1 flex items-center">
          <Button
            variant="ghost"
            size="sm"
            disabled={page <= 1}
            aria-label={t('common.previous')}
            onClick={() => {
              onPageChange(page - 1);
            }}
          >
            <ChevronLeft size={16} aria-hidden />
          </Button>
          <span className="px-2 text-xs text-muted-foreground tabular-nums">
            {page} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={page >= totalPages}
            aria-label={t('common.next')}
            onClick={() => {
              onPageChange(page + 1);
            }}
          >
            <ChevronRight size={16} aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  );
}
