import { useCallback, useSyncExternalStore } from 'react';

/**
 * Si se cumple una media query, en React.
 *
 * Va con `useSyncExternalStore` y no con `useState` + efecto: el ancho de la
 * ventana es estado **de fuera**, y suscribirse a él es justo lo que hace este
 * hook —sin renders en cascada y sin un primer pintado con el valor
 * equivocado—.
 *
 * Se usa para lo que no se puede resolver con clases de Tailwind: elegir qué
 * componente se monta —una agenda o una rejilla— en vez de pintar los dos y
 * esconder uno, que en una pantalla pequeña es trabajo tirado.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const media = globalThis.matchMedia?.(query);
      if (!media) return () => undefined;

      media.addEventListener('change', onChange);
      return () => {
        media.removeEventListener('change', onChange);
      };
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => globalThis.matchMedia?.(query).matches ?? false,
    // En el servidor no hay ventana: se supone escritorio, que es el caso en
    // el que la aplicación pinta más cosas.
    () => false,
  );
}

/** Por debajo de `md`, que es el corte que manda en esta aplicación (Regla 5). */
export const useIsNarrow = (): boolean => useMediaQuery('(max-width: 767px)');
