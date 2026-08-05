import { usePropheciesStats } from '@navis/api-client';
import { Sparkles } from 'lucide-react';
import { Suspense, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { MonthlyChart } from '@/components/prophecies/charts/lazy';
import { PropheciesHeader } from '@/components/prophecies/prophecies-header';
import { ProphecyForm } from '@/components/prophecies/prophecy-form';
import { StatGrid } from '@/components/prophecies/stat-grid';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';

/**
 * La portada de profecías (RFC 0004 §7.3).
 *
 * Se entra a ella y **se sale hacia algún sitio**: cada tarjeta abre el listado
 * con su filtro puesto (D10). Por eso la portada y el listado son dos rutas y
 * no una pestaña (D9).
 */
export function PropheciesPage() {
  const { t } = useTranslation();
  const { data: stats, isLoading } = usePropheciesStats(api);
  const [creating, setCreating] = useState(false);

  if (isLoading || !stats) return <PageSkeleton />;

  return (
    <section className="gap-6 animate-page-in flex flex-col">
      <PropheciesHeader
        stats={stats}
        onAdd={() => {
          setCreating(true);
        }}
      />

      {/* Con cero profecías no se enseñan seis tarjetas a cero: se enseña una
          invitación. Una pantalla vacía invita a hacer algo (Regla 9 §6). */}
      {stats.total === 0 ? (
        <EmptyState
          icon={Sparkles}
          title={t('prophecies.emptyTitle')}
          // `children` es el texto —`EmptyState` ya lo envuelve en su `<p>`— y
          // `action` es el botón. Meter aquí otro `<p>` anida párrafos, que es
          // HTML inválido y React lo canta en consola.
          action={
            <Button
              size="lg"
              onClick={() => {
                setCreating(true);
              }}
            >
              {t('prophecies.add')}
            </Button>
          }
        >
          {t('prophecies.emptyBody')}
        </EmptyState>
      ) : (
        <>
          <StatGrid stats={stats} />

          {/* Entra después de las tarjetas, cerrando la cascada. */}
          <section
            style={{ animationDelay: '380ms' }}
            className="gap-3 p-4 sm:p-5 animate-rise-in flex flex-col rounded-xl border bg-card"
          >
            <h2 className="text-sm font-medium">{t('prophecies.stats.monthly')}</h2>
            <Suspense fallback={<Skeleton className="h-56 w-full" />}>
              <MonthlyChart months={stats.monthly} />
            </Suspense>
          </section>
        </>
      )}

      {creating && (
        <ProphecyForm
          open
          onClose={() => {
            setCreating(false);
          }}
        />
      )}
    </section>
  );
}
