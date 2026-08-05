import {
  DEFAULT_PROPHECY_WINDOW,
  isProphecyState,
  isProphecyWindow,
  type ProphecyState,
  type ProphecyWindow,
} from '@navis/shared';
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';

export interface ProphecyFilters {
  state: ProphecyState[];
  window: ProphecyWindow;
  /** Cuántos hay puestos: es lo que dice el botón «Filtros (2)» en móvil. */
  count: number;
  toggleState: (state: ProphecyState) => void;
  setWindow: (window: ProphecyWindow) => void;
  clear: () => void;
}

/**
 * Los filtros del listado de profecías, guardados en la URL junto a los de
 * `useTableQuery` (RFC 0004 D12).
 *
 * En la URL y no en un store: así las tarjetas de la portada pueden enlazar a
 * «las que siguen en espera» y el botón de atrás hace lo que se espera.
 */
export function useProphecyFilters(): ProphecyFilters {
  const [params, setParams] = useSearchParams();

  const update = useCallback(
    (changes: Record<string, string | string[] | null>) => {
      setParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          for (const [key, value] of Object.entries(changes)) {
            next.delete(key);
            if (Array.isArray(value)) for (const one of value) next.append(key, one);
            else if (value !== null && value !== '') next.set(key, value);
          }
          // Cambiar un filtro vuelve a la primera página: la 7 de los
          // resultados de antes no existe en los de ahora.
          next.delete('page');
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  // Se estabiliza por su contenido: `getAll` devuelve un array nuevo en cada
  // render y, sin esto, el `useMemo` de abajo no serviría de nada.
  const stateKey = params.getAll('state').filter(isProphecyState).join(',');
  const state = useMemo(
    () => (stateKey === '' ? [] : stateKey.split(',').filter(isProphecyState)),
    [stateKey],
  );

  const raw = params.get('window') ?? '';
  const window = isProphecyWindow(raw) ? raw : DEFAULT_PROPHECY_WINDOW;

  return useMemo(
    () => ({
      state,
      window,
      count: state.length + (window === DEFAULT_PROPHECY_WINDOW ? 0 : 1),
      toggleState: (one: ProphecyState) => {
        update({
          state: state.includes(one) ? state.filter((each) => each !== one) : [...state, one],
        });
      },
      setWindow: (next: ProphecyWindow) => {
        update({ window: next === DEFAULT_PROPHECY_WINDOW ? null : next });
      },
      clear: () => {
        update({ state: [], window: null });
      },
    }),
    [state, window, update],
  );
}
