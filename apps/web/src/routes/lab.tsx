import { useTranslation } from 'react-i18next';

import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { FormSkeleton } from '@/components/ui/form-skeleton';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Muestrario de las piezas de interfaz que solo se ven un instante y cuesta
 * mirar con calma en su sitio —hoy, los esqueletos de carga—.
 *
 * No está en la navegación: se abre a mano en `/lab`. Su texto sale de claves
 * que ya existen, así que no añade traducciones a los seis idiomas por una
 * pantalla de taller.
 */
export function LabPage() {
  const { t } = useTranslation();

  return (
    <section className="gap-6 flex flex-col">
      <header>
        <h1 className="text-2xl font-semibold tracking-[-0.02em]">{t('settings.appearance')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('common.loading')}</p>
      </header>

      <div className="gap-6 lg:grid-cols-2 grid">
        <Card className="gap-4 flex flex-col">
          <div>
            <CardTitle className="text-base">PageSkeleton</CardTitle>
            <CardDescription>página entera</CardDescription>
          </div>
          <PageSkeleton cards={2} />
        </Card>

        <Card className="gap-4 flex flex-col">
          <div>
            <CardTitle className="text-base">FormSkeleton</CardTitle>
            <CardDescription>formulario dentro de una tarjeta</CardDescription>
          </div>
          <FormSkeleton fields={2} />
        </Card>
      </div>

      <Card className="gap-3 flex flex-col">
        <CardTitle className="text-base">Skeleton</CardTitle>
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-24 rounded-xl" />
      </Card>
    </section>
  );
}
