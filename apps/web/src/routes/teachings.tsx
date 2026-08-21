import { useTeachingsStats } from '@navis/api-client';
import { GraduationCap, Plus } from 'lucide-react';
import { Suspense, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { TeachingMonthlyChart } from '@/components/charts/lazy';
import { TeachingForm } from '@/components/teachings/teaching-form';
import { TeachingStatsCards } from '@/components/teachings/teaching-stats-cards';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { formatNumber } from '@/lib/format';

/**
 * La portada de enseñanzas (RFC 0022 §3, §6).
 *
 * No repite la composición de profecías: aquí el título va sobre una franja
 * de acento (§3) y la tarjeta grande lleva el color de marca, no el de los
 * controles — para que esta sección se reconozca sin mirar el icono.
 */
export function TeachingsPage() {
  const { t } = useTranslation();
  const { data: stats, isLoading } = useTeachingsStats(api);
  const [creating, setCreating] = useState(false);

  if (isLoading || !stats) return <PageSkeleton />;

  return (
    <section className="gap-6 animate-page-in flex flex-col">
      <header className="p-5 gap-3 sm:flex-row sm:items-end sm:justify-between flex flex-col rounded-xl bg-accent/10">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-[-0.02em]">{t('teachings.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {t('teachings.lead', {
              total: formatNumber(stats.total),
              thisYear: formatNumber(stats.thisYear),
            })}
          </p>
        </div>

        <Button
          size="lg"
          onClick={() => {
            setCreating(true);
          }}
        >
          <Plus size={18} aria-hidden />
          {t('teachings.add')}
        </Button>
      </header>

      {stats.total === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title={t('teachings.emptyTitle')}
          action={
            <Button
              size="lg"
              onClick={() => {
                setCreating(true);
              }}
            >
              {t('teachings.add')}
            </Button>
          }
        >
          {t('teachings.emptyBody')}
        </EmptyState>
      ) : (
        <>
          <TeachingStatsCards stats={stats} />

          <section
            style={{ animationDelay: '380ms' }}
            className="gap-3 p-4 sm:p-5 animate-rise-in flex flex-col rounded-xl border border-accent/40 bg-card"
          >
            <h2 className="text-sm font-medium">{t('teachings.stats.monthly')}</h2>
            <Suspense fallback={<Skeleton className="h-56 w-full" />}>
              <TeachingMonthlyChart months={stats.monthly} />
            </Suspense>
          </section>
        </>
      )}

      {creating && (
        <TeachingForm
          open
          onClose={() => {
            setCreating(false);
          }}
        />
      )}
    </section>
  );
}
