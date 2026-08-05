import {
  addDays,
  toSearchName,
  type PropheciesQuery,
  type ProphecySortField,
  type ProphecyState,
  type ProphecyWindow,
} from '@navis/shared';
import type { SelectQueryBuilder } from 'typeorm';

import { nullsFor } from '../database/date-sql';
import type { Prophecy } from './prophecy.entity';

/**
 * Cómo se traduce cada estado a SQL (RFC 0004 §6.1).
 *
 * Se filtra **en la consulta y no en memoria**: el estado es derivado (D3), pero
 * derivarlo en el servidor después de traer la página daría cuentas y
 * paginación equivocadas.
 */
const STATE_SQL: Record<ProphecyState, string> = {
  espera: 'prophecy.fulfilledAt IS NULL AND prophecy.lastFulfillmentAt IS NULL',
  camino: 'prophecy.fulfilledAt IS NULL AND prophecy.lastFulfillmentAt IS NOT NULL',
  cumplida: 'prophecy.fulfilledAt IS NOT NULL',
};

/** Por qué columna ordena cada campo. `lastMovement` es «lo último que se movió». */
const SORT_SQL: Record<ProphecySortField, string> = {
  received: 'prophecy.receivedAt',
  fulfilled: 'prophecy.fulfilledAt',
  title: 'prophecy.title',
  lastMovement: 'COALESCE(prophecy.last_fulfillment_at, prophecy.received_at)',
};

/** El primer día de la ventana, o `null` si es «todo» (D12). */
export function windowStart(window: ProphecyWindow, today: string): string | null {
  if (window === '7d') return addDays(today, -7);
  if (window === '30d') return addDays(today, -30);
  if (window === 'year') return `${today.slice(0, 4)}-01-01`;
  return null;
}

/** Búsqueda, estados y ventana de tiempo, sobre un constructor ya acotado al dueño. */
export function applyFilters(
  builder: SelectQueryBuilder<Prophecy>,
  query: PropheciesQuery,
  today: string,
): void {
  if (query.search) {
    builder.andWhere('prophecy.searchText LIKE :search', {
      // La misma normalización con la que se guardó, o dejaría de encontrar.
      search: `%${toSearchName(query.search)}%`,
    });
  }

  const states = query.state ?? [];
  if (states.length > 0) {
    const clause = states.map((state) => `(${STATE_SQL[state]})`).join(' OR ');
    builder.andWhere(`(${clause})`);
  }

  const from = query.from ?? windowStart(query.window ?? 'all', today);
  if (from) builder.andWhere('prophecy.receivedAt >= :from', { from });
  if (query.to) builder.andWhere('prophecy.receivedAt <= :to', { to: query.to });
}

/**
 * El orden, con el desempate por identificador.
 *
 * Sin él, dos profecías del mismo día pueden salir en distinto orden en dos
 * páginas seguidas y una de ellas se repetiría mientras otra desaparece.
 */
export function applyOrder(
  builder: SelectQueryBuilder<Prophecy>,
  sort: ProphecySortField,
  order: 'asc' | 'desc',
): void {
  const direction = order === 'asc' ? 'ASC' : 'DESC';
  // `NULLS FIRST` no existe en SQLite: la cláusula se pone solo en Postgres.
  builder.orderBy(SORT_SQL[sort], direction, nullsFor(direction));
  builder.addOrderBy('prophecy.id', direction);
}
