import azulSinFondo from '@navis/theme/logo/azul-sin-fondo.svg?url';
import blancoSinFondo from '@navis/theme/logo/blanco-sin-fondo.svg?url';

import { cn } from '@/lib/cn';

/**
 * El logo de la marca. Único punto de entrada del logo en la web: viene de
 * `packages/theme/src/logo`, así que cambiarlo allí lo cambia en toda la app.
 *
 * La variante azul es para fondos claros y la blanca para fondos de color;
 * `auto` deja que mande el tema, que es lo que quieres casi siempre.
 */
export function Logo({
  variante = 'auto',
  className,
}: {
  variante?: 'auto' | 'azul' | 'blanco';
  className?: string;
}) {
  const clases = cn('h-10 w-10 select-none', className);

  if (variante !== 'auto') {
    return (
      <img
        src={variante === 'azul' ? azulSinFondo : blancoSinFondo}
        alt="Navis"
        className={clases}
      />
    );
  }

  // Dos imágenes y una escondida según el tema: un solo <img> con `src`
  // dinámico parpadearía al cambiar de tema mientras carga la otra.
  return (
    <>
      <img src={azulSinFondo} alt="Navis" className={cn(clases, 'dark:hidden')} />
      <img src={blancoSinFondo} alt="" aria-hidden className={cn(clases, 'hidden dark:block')} />
    </>
  );
}
