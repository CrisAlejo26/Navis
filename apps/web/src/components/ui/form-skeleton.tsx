import { useTranslation } from 'react-i18next';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/cn';

/**
 * El hueco de un formulario: la etiqueta y el campo de cada fila, y el botón.
 * Se usa donde antes había un indicador dando vueltas, para que el formulario
 * aparezca en su sitio en vez de empujar la tarjeta al llegar.
 */
export function FormSkeleton({ fields = 3, className }: { fields?: number; className?: string }) {
  const { t } = useTranslation();

  return (
    <div role="status" aria-busy className={cn('gap-4 flex flex-col', className)}>
      <span className="sr-only">{t('common.loading')}</span>

      {Array.from({ length: fields }, (_, index) => (
        <div key={index} className="gap-2 flex flex-col">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-10 rounded-lg" />
        </div>
      ))}

      <Skeleton className="h-10 w-32 rounded-lg" />
    </div>
  );
}
