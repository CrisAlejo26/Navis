import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';

import {
  DEFAULT_VIEW,
  effectiveRange,
  isCalendarView,
  stepAnchor,
  type CalendarView,
  type DateRange,
} from './view-range';

/** Hoy **en la zona del navegador**: `en-CA` da exactamente `AAAA-MM-DD`. */
export function todayIso(): string {
  return new Intl.DateTimeFormat('en-CA').format(new Date());
}

export interface CalendarFilters {
  /** Sedes marcadas. Vacío es «todas». */
  congregationIds: string[];
  /** Ver solo lo de una persona. */
  personId: string | null;
  /** Ver solo las fases que faltan por cubrir. */
  pending: boolean;
  /** Busca por persona, fase o nombre de la reunión. */
  q: string;
}

/**
 * El estado de la pantalla vive en la URL, en un solo sitio.
 *
 * Así un enlace lleva a exactamente lo que se estaba mirando —vista, tramo y
 * filtros— y las cuatro vistas comparten estado sin cuatro copias que se
 * desincronicen al cambiar de pestaña (§8.3).
 */
export interface CalendarParams {
  view: CalendarView;
  anchor: string;
  custom: DateRange | null;
  range: DateRange;
  filters: CalendarFilters;
  hasFilters: boolean;
  setView: (view: CalendarView) => void;
  setAnchor: (anchor: string) => void;
  step: (delta: number) => void;
  goToday: () => void;
  setCustom: (range: DateRange | null) => void;
  setFilters: (patch: Partial<CalendarFilters>) => void;
  clearFilters: () => void;
}

export function useCalendarParams(): CalendarParams {
  const [params, setParams] = useSearchParams();

  const view = readView(params.get('view'));
  const anchor = params.get('at') ?? todayIso();
  const from = params.get('from');
  const to = params.get('to');
  const custom = from && to ? { from, to } : null;

  const filters = useMemo<CalendarFilters>(
    () => ({
      congregationIds: (params.get('sede') ?? '').split(',').filter(Boolean),
      personId: params.get('quien'),
      pending: params.get('faltan') === '1',
      q: params.get('q') ?? '',
    }),
    [params],
  );

  const patch = useCallback(
    (changes: Record<string, string | null>) => {
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          for (const [key, value] of Object.entries(changes)) {
            if (value === null || value === '') next.delete(key);
            else next.set(key, value);
          }
          return next;
        },
        // Sin `replace`, avanzar seis meses dejaría seis entradas en el
        // historial y el botón «atrás» del navegador sería inútil.
        { replace: true },
      );
    },
    [setParams],
  );

  return {
    view,
    anchor,
    custom,
    range: effectiveRange(view, anchor, custom),
    filters,
    hasFilters:
      filters.congregationIds.length > 0 || !!filters.personId || filters.pending || !!filters.q,
    setView: (next) => {
      patch({ view: next });
    },
    setAnchor: (next) => {
      patch({ at: next, from: null, to: null });
    },
    step: (delta) => {
      patch({ at: stepAnchor(view, anchor, delta), from: null, to: null });
    },
    goToday: () => {
      patch({ at: todayIso(), from: null, to: null });
    },
    setCustom: (next) => {
      patch({ from: next?.from ?? null, to: next?.to ?? null });
    },
    setFilters: (change) => {
      patch({
        ...(change.congregationIds ? { sede: change.congregationIds.join(',') } : {}),
        ...(change.personId !== undefined ? { quien: change.personId } : {}),
        ...(change.pending !== undefined ? { faltan: change.pending ? '1' : null } : {}),
        ...(change.q !== undefined ? { q: change.q } : {}),
      });
    },
    clearFilters: () => {
      patch({ sede: null, quien: null, faltan: null, q: null });
    },
  };
}

function readView(value: string | null): CalendarView {
  return value && isCalendarView(value) ? value : DEFAULT_VIEW;
}
