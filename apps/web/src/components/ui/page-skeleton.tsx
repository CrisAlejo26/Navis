import { useTranslation } from 'react-i18next';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/cn';

/**
 * El hueco de una página entera mientras llegan sus datos: el titular y unas
 * tarjetas con la misma forma que tendrá el contenido.
 *
 * Es lo que se enseña en **toda** espera de la aplicación. Un esqueleto ocupa
 * el sitio de lo que viene, así que la página no pega un salto al llegar los
 * datos y quien mira ya sabe qué va a aparecer.
 */
export function PageSkeleton({ cards = 3, className }: { cards?: number; className?: string }) {
  const { t } = useTranslation();

  return (
    <div role="status" aria-busy className={cn('gap-6 flex flex-col', className)}>
      <span className="sr-only">{t('common.loading')}</span>

      <div className="gap-2 flex flex-col">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="gap-4 sm:grid-cols-2 lg:grid-cols-3 grid">
        {Array.from({ length: cards }, (_, index) => (
          <Skeleton key={index} className="h-28 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
