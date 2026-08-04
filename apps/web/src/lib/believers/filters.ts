import { BELIEVER_STATUSES, type BelieverStatus } from '@navis/shared';
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';

export interface BelieverFilters {
  status: BelieverStatus[];
  congregationId: string;
  giftId: string;
  attention: boolean;
  /** Cuántos hay puestos: es lo que dice el botón «Filtros (2)» en móvil. */
  count: number;
  toggleStatus: (status: BelieverStatus) => void;
  setCongregation: (id: string) => void;
  setGift: (id: string) => void;
  toggleAttention: () => void;
  clear: () => void;
}

const isStatus = (value: string): value is BelieverStatus =>
  (BELIEVER_STATUSES as readonly string[]).includes(value);

/**
 * Los filtros propios del listado de creyentes, guardados en la URL junto a los
 * de `useTableQuery` (§7.2).
 *
 * En la URL y no en un store: una búsqueda concreta —«los que piden atención en
 * Elda»— se comparte por enlace y el botón de atrás hace lo que se espera. Lo
 * que sí es preferencia de quien mira va aparte, en `useBelieversViewStore`.
 */
export function useBelieverFilters(): BelieverFilters {
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
  const statusKey = params.getAll('status').filter(isStatus).join(',');
  const status = useMemo(
    () => (statusKey === '' ? [] : statusKey.split(',').filter(isStatus)),
    [statusKey],
  );

  const congregationId = params.get('congregationId') ?? '';
  const giftId = params.get('giftId') ?? '';
  const attention = params.get('attention') === 'true';

  return useMemo(
    () => ({
      status,
      congregationId,
      giftId,
      attention,
      count: status.length + (congregationId ? 1 : 0) + (giftId ? 1 : 0) + (attention ? 1 : 0),
      toggleStatus: (one: BelieverStatus) => {
        const next = status.includes(one)
          ? status.filter((each) => each !== one)
          : [...status, one];
        update({ status: next });
      },
      setCongregation: (id: string) => {
        update({ congregationId: id });
      },
      setGift: (id: string) => {
        update({ giftId: id });
      },
      toggleAttention: () => {
        update({ attention: attention ? null : 'true' });
      },
      clear: () => {
        update({ status: [], congregationId: null, giftId: null, attention: null });
      },
    }),
    [status, congregationId, giftId, attention, update],
  );
}
