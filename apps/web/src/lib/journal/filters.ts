import {
  DEFAULT_JOURNAL_WINDOW,
  isEntryKind,
  isJournalWindow,
  type EntryKind,
  type JournalWindow,
} from '@navis/shared';
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';

export interface JournalFilters {
  kind: EntryKind[];
  window: JournalWindow;
  /** El tramo a medida, que manda sobre la ventana rápida cuando está puesto. */
  from: string;
  to: string;
  pendingReminder: boolean;
  /** Cuántos hay puestos: es lo que dice el botón «Filtros (2)» en móvil. */
  count: number;
  toggleKind: (kind: EntryKind) => void;
  setWindow: (window: JournalWindow) => void;
  setRange: (range: { from: string; to: string }) => void;
  setPendingReminder: (value: boolean) => void;
  clear: () => void;
}

/**
 * Los filtros del listado del cuaderno, guardados en la URL junto a los de
 * `useTableQuery` (RFC 0017 D9).
 *
 * En la URL y no en un store: así las tarjetas de la portada pueden enlazar a
 * «los recordatorios pendientes» o a «lo de oración» y el botón de atrás hace
 * lo que se espera.
 */
export function useJournalFilters(): JournalFilters {
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
  const kindKey = params.getAll('kind').filter(isEntryKind).join(',');
  const kind = useMemo(
    () => (kindKey === '' ? [] : kindKey.split(',').filter(isEntryKind)),
    [kindKey],
  );

  const rawWindow = params.get('window') ?? '';
  const window = isJournalWindow(rawWindow) ? rawWindow : DEFAULT_JOURNAL_WINDOW;

  const from = params.get('from') ?? '';
  const to = params.get('to') ?? '';
  const pendingReminder = params.get('pendingReminder') === 'true';

  return useMemo(
    () => ({
      kind,
      window,
      from,
      to,
      pendingReminder,
      count:
        kind.length +
        (window === DEFAULT_JOURNAL_WINDOW ? 0 : 1) +
        (from ? 1 : 0) +
        (to ? 1 : 0) +
        (pendingReminder ? 1 : 0),
      toggleKind: (one: EntryKind) => {
        update({ kind: kind.includes(one) ? kind.filter((each) => each !== one) : [...kind, one] });
      },
      // Elegir una ventana rápida limpia el tramo a medida: tener los dos
      // puestos deja una pantalla que dice una cosa y filtra otra.
      setWindow: (next: JournalWindow) => {
        update({ window: next === DEFAULT_JOURNAL_WINDOW ? null : next, from: null, to: null });
      },
      setRange: (range: { from: string; to: string }) => {
        update({ from: range.from || null, to: range.to || null, window: null });
      },
      setPendingReminder: (value: boolean) => {
        update({ pendingReminder: value ? 'true' : null });
      },
      clear: () => {
        update({ kind: [], window: null, from: null, to: null, pendingReminder: null });
      },
    }),
    [kind, window, from, to, pendingReminder, update],
  );
}
