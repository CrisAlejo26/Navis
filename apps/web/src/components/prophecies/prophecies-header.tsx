import type { PropheciesStats } from '@navis/shared';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { formatNumber } from '@/lib/format';

/**
 * Título, la frase de estado y la acción principal.
 *
 * Una **frase**, no cuatro tarjetas con un número grande: eso es la salida por
 * defecto (Regla 9 §2) y además separa el número del filtro. Las cuentas que se
 * pulsan viven en las pastillas (§7.4) y en las tarjetas de la portada (D10).
 */
export function PropheciesHeader({
  stats,
  onAdd,
}: {
  stats: PropheciesStats | undefined;
  onAdd: () => void;
}) {
  const { t } = useTranslation();

  return (
    <header className="gap-3 sm:flex-row sm:items-end sm:justify-between flex flex-col">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-[-0.02em]">{t('prophecies.title')}</h1>
        {stats && (
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {t('prophecies.lead', {
              total: formatNumber(stats.total),
              waiting: formatNumber(stats.byState.espera + stats.byState.camino),
              fulfilled: formatNumber(stats.byState.cumplida),
            })}
          </p>
        )}
      </div>

      {/* 48 px: es la acción principal y se pulsa de pie (Regla 5 §4). */}
      <Button size="lg" className="shrink-0" onClick={onAdd}>
        <Plus size={18} aria-hidden />
        {t('prophecies.add')}
      </Button>
    </header>
  );
}
