// Las versiones encuadradas, no las originales: estas últimas traen tanto
// margen que dentro de una caja pequeña el barco se queda en nada.
import azul from '@navis/theme/logo/encuadrado/azul.svg?url';
import blanco from '@navis/theme/logo/encuadrado/blanco.svg?url';

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
    return <img src={variante === 'azul' ? azul : blanco} alt="Navis" className={clases} />;
  }

  // Dos imágenes y una escondida según el tema: un solo <img> con `src`
  // dinámico parpadearía al cambiar de tema mientras carga la otra.
  return (
    <>
      <img src={azul} alt="Navis" className={cn(clases, 'dark:hidden')} />
      <img src={blanco} alt="" aria-hidden className={cn(clases, 'hidden dark:block')} />
    </>
  );
}
