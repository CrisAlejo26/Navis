import { useJournalStats } from '@navis/api-client';
import { NotebookPen } from 'lucide-react';
import { Suspense, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { JournalMonthlyChart } from '@/components/charts/lazy';
import { EntryForm } from '@/components/journal/entry-form';
import { JournalStatGrid } from '@/components/journal/journal-stat-grid';
import { Oleaje } from '@/components/journal/oleaje';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { formatNumber } from '@/lib/format';

/**
 * La portada del cuaderno (RFC 0017 §7.3).
 *
 * Se entra a ella y **se sale hacia algún sitio**: cada tarjeta abre el
 * listado con su filtro puesto (D11). El oleaje, bajo la cabecera, es el
 * elemento firma de esta pantalla y el único bucle del proyecto fuera de una
 * pantalla de acceso (D14, §7.6).
 */
export function JournalPage() {
  const { t } = useTranslation();
  const { data: stats, isLoading } = useJournalStats(api);
  const [creating, setCreating] = useState(false);

  if (isLoading || !stats) return <PageSkeleton />;

  return (
    <section className="gap-6 animate-page-in flex flex-col">
      <header className="gap-3 sm:flex-row sm:items-end sm:justify-between flex flex-col">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-[-0.02em]">{t('journal.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {t('journal.lead', {
              total: formatNumber(stats.total),
              pending: formatNumber(stats.pendingReminders),
            })}
          </p>
        </div>

        <Button
          size="lg"
          onClick={() => {
            setCreating(true);
          }}
        >
          {t('journal.add')}
        </Button>
      </header>

      <Oleaje />

      {stats.total === 0 ? (
        <EmptyState
          icon={NotebookPen}
          title={t('journal.emptyTitle')}
          action={
            <Button
              size="lg"
              onClick={() => {
                setCreating(true);
              }}
            >
              {t('journal.add')}
            </Button>
          }
        >
          {t('journal.emptyBody')}
        </EmptyState>
      ) : (
        <>
          <JournalStatGrid stats={stats} />

          <section
            style={{ animationDelay: '380ms' }}
            className="gap-3 p-4 sm:p-5 animate-rise-in flex flex-col rounded-xl border bg-card"
          >
            <h2 className="text-sm font-medium">{t('journal.stats.monthly')}</h2>
            <Suspense fallback={<Skeleton className="h-56 w-full" />}>
              <JournalMonthlyChart months={stats.monthly} />
            </Suspense>
          </section>
        </>
      )}

      {creating && (
        <EntryForm
          open
          onClose={() => {
            setCreating(false);
          }}
        />
      )}
    </section>
  );
}
