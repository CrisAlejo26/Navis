import { cn } from '@/lib/cn';

/**
 * La insignia de una iglesia: su inicial en un cuadrado pequeño.
 *
 * Es lo único de la barra lateral que cambia al cambiar de espacio de trabajo,
 * y por eso lleva el color: la activa va sobre el degradado del azul de la
 * interfaz y las de la lista, apagadas, para que solo destaque una.
 */
export function ChurchBadge({
  name,
  muted = false,
  className,
}: {
  name: string;
  /** Apagada, para las que no son la activa. */
  muted?: boolean;
  className?: string;
}) {
  const inicial = name.trim().charAt(0).toUpperCase() || '·';

  return (
    <span
      aria-hidden
      className={cn(
        'h-6 w-6 text-xs font-semibold flex shrink-0 items-center justify-center rounded-md',
        muted
          ? 'bg-muted text-muted-foreground'
          : 'bg-linear-to-br from-primary to-primary/60 text-primary-foreground',
        className,
      )}
    >
      {inicial}
    </span>
  );
}
