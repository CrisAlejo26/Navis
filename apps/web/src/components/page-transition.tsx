import type { ReactNode } from 'react';
import { useLocation } from 'react-router';

import { cn } from '@/lib/cn';

/**
 * La transición de página de Navis: un fundido con un desplazamiento corto
 * hacia arriba. Es el mismo gesto en todas partes —el contenido de la app y
 * las pantallas de acceso—, y por eso vive aquí y no repetido en cada ruta.
 *
 * Barata a propósito: sin librería de animación y moviendo solo `opacity` y
 * `transform`, que el navegador resuelve en el compositor. Y se apaga sola con
 * `prefers-reduced-motion` (ver global.css).
 *
 * La `key` es lo que hace que se repita en cada cambio de ruta: sin ella React
 * reutiliza el nodo y el navegador no vuelve a lanzar la animación. Va solo con
 * `pathname`, no con la query, para no remontar la pantalla al filtrar o
 * paginar.
 *
 * Ojo: crea un contexto de apilamiento (`transform`), así que un hijo con
 * `position: fixed` se posicionaría respecto a este div. Lo fijo —como la
 * navegación inferior— se deja fuera.
 */
export function PageTransition({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { pathname } = useLocation();

  return (
    <div key={pathname} className={cn('animate-page-in', className)}>
      {children}
    </div>
  );
}
