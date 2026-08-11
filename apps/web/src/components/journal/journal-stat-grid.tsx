import type { JournalStats } from '@navis/shared';
import { Bell, CalendarClock, NotebookPen } from 'lucide-react';
import { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Sparkline } from '@/components/charts/lazy';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import { accentVars } from '@/lib/accents';
import { ENTRY_KIND_ORDER, ENTRY_KIND_STYLES } from '@/lib/journal/entry-kind';
import { formatNumber } from '@/lib/format';

const LISTA = '/journal/list';

/** Una de las siete mini-tarjetas del reparto por tipo (D2, D15). */
function KindMiniCard({
  kind,
  count,
  index,
}: {
  kind: (typeof ENTRY_KIND_ORDER)[number];
  count: number;
  index: number;
}) {
  const { t } = useTranslation();
  const { Icon, accent, labelKey } = ENTRY_KIND_STYLES[kind];

  return (
    <Link
      to={`${LISTA}?kind=${kind}`}
      style={{ ...accentVars(accent), animationDelay: `${String(Math.min(index, 6) * 60)}ms` }}
      className="gap-2 p-3 animate-rise-in flex items-center rounded-lg border border-[var(--acento)]/25 bg-[var(--acento)]/8 transition-colors duration-200 hover:border-[var(--acento)]/50"
    >
      <span className="size-7 inline-flex shrink-0 items-center justify-center rounded-md bg-[var(--acento)]/15 text-[var(--acento)]">
        <Icon size={15} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="text-xs block truncate text-muted-foreground">{t(labelKey)}</span>
        <span className="text-lg font-semibold block tabular-nums">{formatNumber(count)}</span>
      </span>
    </Link>
  );
}

/**
 * Las cuatro tarjetas de la portada (RFC 0017 §7.3, D11).
 *
 * Cada una abre el listado con su filtro ya puesto: la métrica es la
 * navegación. La cuarta no es una tarjeta, son siete: el reparto por tipo,
 * cada una en su color (D15) — con las siete a la vista, la portada no
 * necesita ningún degradado de relleno para no verse vacía.
 */
export function JournalStatGrid({ stats }: { stats: JournalStats }) {
  const { t } = useTranslation();
  const porMes = stats.monthly.map((month) => month.total);

  return (
    <div className="gap-4 sm:grid-cols-2 xl:grid-cols-4 grid">
      <StatCard
        to={LISTA}
        index={0}
        tone="filled"
        Icon={NotebookPen}
        label={t('journal.stats.total')}
        value={formatNumber(stats.total)}
        cta={t('journal.open')}
      >
        {/* El reparto entre los siete tipos, como una sola barra —mismo
            criterio que la de profecías, con siete tramos en vez de tres. */}
        <span
          aria-hidden
          className="h-1.5 flex overflow-hidden rounded-full bg-primary-foreground/20"
        >
          {ENTRY_KIND_ORDER.map((kind) => (
            <span
              key={kind}
              className="bg-primary-foreground/60"
              style={{
                width: `${String(stats.total === 0 ? 0 : (stats.byKind[kind] / stats.total) * 100)}%`,
              }}
            />
          ))}
        </span>
      </StatCard>

      <StatCard
        to={`${LISTA}?pendingReminder=true`}
        index={1}
        tone="accent"
        accent="warning"
        Icon={Bell}
        label={t('journal.stats.pendingReminders')}
        value={formatNumber(stats.pendingReminders)}
      />

      <StatCard
        to={`${LISTA}?window=year`}
        index={2}
        tone="accent"
        accent="primary"
        Icon={CalendarClock}
        label={t('journal.stats.thisMonth')}
        value={formatNumber(stats.thisMonth)}
        wide
      >
        <Suspense fallback={<Skeleton className="h-6 w-full" />}>
          <Sparkline values={porMes} />
        </Suspense>
      </StatCard>

      <div
        style={{ animationDelay: '180ms' }}
        className="gap-2 sm:col-span-2 xl:col-span-4 animate-rise-in sm:grid-cols-4 xl:grid-cols-7 grid grid-cols-2"
      >
        {ENTRY_KIND_ORDER.map((kind, index) => (
          <KindMiniCard key={kind} kind={kind} count={stats.byKind[kind]} index={index} />
        ))}
      </div>
    </div>
  );
}
