import type { DreamsStats } from '@navis/shared';
import { Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { formatNumber } from '@/lib/format';

/**
 * Título, la frase de estado y la acción principal.
 *
 * Una **frase**, no cuatro tarjetas con un número grande: eso es la salida por
 * defecto (Regla 9 §2) y además separa el número del filtro. Las cuentas que se
 * pulsan viven en las tarjetas de la portada (D16).
 */
export function DreamsHeader({
  stats,
  onAdd,
  children,
}: {
  stats: DreamsStats | undefined;
  onAdd: () => void;
  /** Lo que acompaña a la acción principal. El listado pone ahí las fechas. */
  children?: ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <header className="gap-3 sm:flex-row sm:items-end sm:justify-between flex flex-col">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-[-0.02em]">{t('dreams.title')}</h1>
        {stats && (
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {t('dreams.lead', {
              total: formatNumber(stats.total),
              month: formatNumber(stats.thisMonth),
              fulfilled: formatNumber(stats.fulfilled),
            })}
          </p>
        )}
      </div>

      <div className="gap-2 flex shrink-0 flex-wrap items-center">
        {children}

        {/* 48 px: es la acción principal y se pulsa recién despierto (Regla 5 §4). */}
        <Button size="lg" onClick={onAdd}>
          <Plus size={18} aria-hidden />
          {t('dreams.add')}
        </Button>
      </div>
    </header>
  );
}
