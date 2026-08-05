import { useDreamsStats } from '@navis/api-client';
import { todayIn } from '@navis/shared';
import { MoonStar } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DreamForm } from '@/components/dreams/dream-form';
import { DreamsHeader } from '@/components/dreams/dreams-header';
import { EmotionsMap } from '@/components/dreams/emotions-map';
import { NightsStrip } from '@/components/dreams/nights-strip';
import { StatGrid } from '@/components/dreams/stat-grid';
import { WeekdayPanel } from '@/components/dreams/weekday-panel';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { api } from '@/lib/api';

/**
 * La portada de sueños (RFC 0005 §7.3).
 *
 * Se entra a ella y **se sale hacia algún sitio**: cada tarjeta, cada celda de
 * la franja y cada tramo del mapa de emociones abren el listado con su filtro
 * puesto (D16). Por eso la portada y el listado son dos rutas y no una pestaña.
 *
 * El orden de arriba abajo no es casual: primero la franja, que es el elemento
 * firma y lo que se recuerda (D19); después los números; y al final los dos
 * paneles que explican **cuándo** y **qué se siente**. Una audacia por pantalla
 * y el resto acompañando (D20).
 */
export function DreamsPage() {
  const { t } = useTranslation();
  const { data: stats, isLoading } = useDreamsStats(api);
  const [creating, setCreating] = useState(false);
  // El día de quien mira, no el del servidor: es el que marca la franja, y en
  // el cambio de día los dos pueden discrepar.
  const today = todayIn(Intl.DateTimeFormat().resolvedOptions().timeZone);

  if (isLoading || !stats) return <PageSkeleton />;

  return (
    <section className="gap-6 animate-page-in flex flex-col">
      <DreamsHeader
        stats={stats}
        onAdd={() => {
          setCreating(true);
        }}
      />

      {/* Con cero sueños no se enseñan cuatro tarjetas a cero: se enseña una
          invitación. Una pantalla vacía invita a hacer algo (Regla 9 §6). */}
      {stats.total === 0 ? (
        <EmptyState
          icon={MoonStar}
          title={t('dreams.emptyTitle')}
          action={
            <Button
              size="lg"
              onClick={() => {
                setCreating(true);
              }}
            >
              {t('dreams.add')}
            </Button>
          }
        >
          {t('dreams.emptyBody')}
        </EmptyState>
      ) : (
        <>
          {/* Las cuentas primero: son lo que se viene a mirar. La franja va
              debajo, que es donde se mira con calma. */}
          <StatGrid stats={stats} />

          {/* Mitad y mitad: las dos responden a «cuándo sueño», y una más
              grande que la otra hacía que la pequeña se leyera como una nota al
              pie. Al ir en la misma fila salen además con el mismo alto. */}
          <div className="gap-4 lg:grid-cols-2 grid">
            <NightsStrip nights={stats.nights} weeks={stats.weeks} today={today} />
            <WeekdayPanel days={stats.byWeekday} />
          </div>

          <EmotionsMap emotions={stats.byEmotion} />
        </>
      )}

      {creating && (
        <DreamForm
          open
          onClose={() => {
            setCreating(false);
          }}
        />
      )}
    </section>
  );
}
