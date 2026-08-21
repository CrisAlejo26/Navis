import type { TeachingsStats } from '@navis/shared';
import { GraduationCap, ListChecks } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { StatCard } from '@/components/ui/stat-card';
import { formatNumber } from '@/lib/format';

const LISTADO = '/teachings/list';

/**
 * Las tarjetas de la portada (RFC 0022 §1, §3): no son las seis de
 * profecías con un tono más. La grande lleva **el color de marca**
 * (`bg-brand`, no `bg-primary`) porque enseña la cifra que ningún otro
 * módulo tiene — cuánto de la checklist está hecho—, y las otras dos van en
 * `accent` para que la pantalla no se quede en blanco y gris.
 */
export function TeachingStatsCards({ stats }: { stats: TeachingsStats }) {
  const { t } = useTranslation();

  return (
    <div className="gap-4 sm:grid-cols-3 grid">
      <Link
        to={LISTADO}
        style={{ animationDelay: '0ms' }}
        className="p-5 gap-3 group animate-rise-in hover:shadow-md sm:col-span-1 flex flex-col rounded-xl border border-brand bg-brand text-brand-foreground transition-shadow duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <span className="gap-2 flex items-center">
          <span
            aria-hidden
            className="size-7 inline-flex items-center justify-center rounded-lg bg-brand-foreground/15"
          >
            <ListChecks size={15} />
          </span>
          <span className="text-xs font-medium text-brand-foreground/80">
            {t('teachings.stats.checklist')}
          </span>
        </span>

        <span className="text-3xl font-semibold leading-none tracking-[-0.02em] tabular-nums">
          {stats.checklistRate === null
            ? t('teachings.stats.noData')
            : `${String(Math.round(stats.checklistRate * 100))}%`}
        </span>

        {stats.checklistTotal > 0 && (
          <span className="text-xs text-brand-foreground/80 tabular-nums">
            {t('teachings.stats.checklistValue', {
              checked: formatNumber(stats.checklistChecked),
              total: formatNumber(stats.checklistTotal),
            })}
          </span>
        )}
      </Link>

      <StatCard
        to={LISTADO}
        index={1}
        tone="accent"
        accent="primary"
        Icon={GraduationCap}
        label={t('teachings.stats.total')}
        value={formatNumber(stats.total)}
        cta={t('teachings.open')}
      />

      <StatCard
        to={`${LISTADO}?sort=received&order=desc`}
        index={2}
        tone="accent"
        accent="success"
        label={t('teachings.stats.thisYear')}
        value={formatNumber(stats.thisYear)}
      />
    </div>
  );
}
