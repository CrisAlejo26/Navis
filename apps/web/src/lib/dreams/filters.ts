import { isDreamState, type DreamState } from '@navis/shared';
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';

export interface DreamFilters {
  state: DreamState[];
  emotion: string[];
  /** El tramo de noches a medida. Cadena vacía es «sin límite por ese lado». */
  from: string;
  to: string;
  /** Cuántos hay puestos: es lo que dice el botón «Filtros (2)» en móvil. */
  count: number;
  toggleState: (state: DreamState) => void;
  toggleEmotion: (id: string) => void;
  setRange: (range: { from: string; to: string }) => void;
  clear: () => void;
}

/**
 * Los filtros del listado de sueños, guardados en la URL (RFC 0005 D16).
 *
 * En la URL y no en un store: así cada tarjeta de la portada y cada celda de la
 * franja pueden enlazar a «los de esa emoción» o «los de esa noche», y el botón
 * de atrás hace lo que se espera.
 */
export function useDreamFilters(): DreamFilters {
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

  // Se estabilizan por su contenido: `getAll` devuelve un array nuevo en cada
  // render y, sin esto, el `useMemo` de abajo no serviría de nada.
  const stateKey = params.getAll('state').filter(isDreamState).join(',');
  const emotionKey = params.getAll('emotion').join(',');

  const state = useMemo(
    () => (stateKey === '' ? [] : stateKey.split(',').filter(isDreamState)),
    [stateKey],
  );
  const emotion = useMemo(() => (emotionKey === '' ? [] : emotionKey.split(',')), [emotionKey]);

  const from = params.get('from') ?? '';
  const to = params.get('to') ?? '';

  return useMemo(
    () => ({
      state,
      emotion,
      from,
      to,
      count: state.length + emotion.length + (from ? 1 : 0) + (to ? 1 : 0),
      toggleState: (one: DreamState) => {
        update({
          state: state.includes(one) ? state.filter((each) => each !== one) : [...state, one],
        });
      },
      toggleEmotion: (id: string) => {
        update({
          emotion: emotion.includes(id) ? emotion.filter((each) => each !== id) : [...emotion, id],
        });
      },
      setRange: (range: { from: string; to: string }) => {
        update({ from: range.from || null, to: range.to || null });
      },
      clear: () => {
        update({ state: [], emotion: [], from: null, to: null });
      },
    }),
    [state, emotion, from, to, update],
  );
}
