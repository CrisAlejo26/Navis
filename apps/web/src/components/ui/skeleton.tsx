import { cn } from '@/lib/cn';

/**
 * Hueco que ocupa el sitio de algo que está cargando, para que la página no
 * pegue un salto cuando llegan los datos.
 *
 * Late con `opacity`, no con un degradado en movimiento: es más barato y se
 * apaga solo con `prefers-reduced-motion` (Regla 9).
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn('h-4 animate-pulse block rounded-md bg-muted', className)} />
  );
}
