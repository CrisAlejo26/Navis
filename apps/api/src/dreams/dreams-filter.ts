import type { DreamSortField, DreamState, DreamsQuery } from '@navis/shared';
import { toSearchName } from '@navis/shared';
import type { SelectQueryBuilder } from 'typeorm';

import { nullsFor } from '../database/date-sql';
import type { Dream } from './dream.entity';

/**
 * Cómo se traduce cada estado a SQL (RFC 0005 §6.1).
 *
 * Se filtra **en la consulta y no en memoria**: el estado es derivado (D8), pero
 * derivarlo después de traer la página daría cuentas y paginación equivocadas.
 *
 * La comparación contra `''` acompaña siempre al `IS NULL` porque una
 * interpretación en blanco no es una interpretación, y es exactamente lo que
 * hace `dreamState` en `@navis/shared`: si las dos reglas divergen, el listado
 * filtrado enseñaría un estado y la ficha, otro.
 */
const STATE_SQL: Record<DreamState, string> = {
  apuntado:
    "dream.fulfilledAt IS NULL AND (dream.interpretation IS NULL OR dream.interpretation = '')",
  estudio:
    "dream.fulfilledAt IS NULL AND dream.interpretation IS NOT NULL AND dream.interpretation <> ''",
  cumplido: 'dream.fulfilledAt IS NOT NULL',
};

/** Por qué columna ordena cada campo. */
const SORT_SQL: Record<DreamSortField, string> = {
  dreamed: 'dream.dreamedAt',
  fulfilled: 'dream.fulfilledAt',
  title: 'dream.title',
};

/**
 * Búsqueda, estados, tramo y emociones, sobre un constructor ya acotado al dueño.
 *
 * Las emociones llegan **ya resueltas a identificadores de sueño** y no como un
 * `JOIN`: con la unión dentro, un sueño con tres emociones saldría tres veces y
 * habría que arrastrar un `DISTINCT` hasta la paginación.
 */
export function applyFilters(
  builder: SelectQueryBuilder<Dream>,
  query: DreamsQuery,
  emotionDreamIds: readonly string[] | null,
): void {
  if (query.search) {
    builder.andWhere('dream.searchText LIKE :search', {
      // La misma normalización con la que se guardó, o dejaría de encontrar.
      search: `%${toSearchName(query.search)}%`,
    });
  }

  const states = query.state ?? [];
  if (states.length > 0) {
    const clause = states.map((state) => `(${STATE_SQL[state]})`).join(' OR ');
    builder.andWhere(`(${clause})`);
  }

  if (query.from) builder.andWhere('dream.dreamedAt >= :from', { from: query.from });
  if (query.to) builder.andWhere('dream.dreamedAt <= :to', { to: query.to });
  if (query.year !== undefined) {
    builder.andWhere('dream.dreamedAt >= :yearStart', { yearStart: `${String(query.year)}-01-01` });
    builder.andWhere('dream.dreamedAt <= :yearEnd', { yearEnd: `${String(query.year)}-12-31` });
  }

  if (emotionDreamIds !== null) {
    // Ninguna coincidencia es una respuesta vacía, no «sin filtro»: un `IN ()`
    // vacío es además un error de sintaxis en los dos motores.
    if (emotionDreamIds.length === 0) {
      builder.andWhere('1 = 0');
      return;
    }
    builder.andWhere('dream.id IN (:...emotionDreamIds)', {
      emotionDreamIds: [...emotionDreamIds],
    });
  }
}

/**
 * El orden, con el desempate por identificador.
 *
 * Sin él, dos sueños de la misma noche pueden salir en distinto orden en dos
 * páginas seguidas y uno de ellos se repetiría mientras otro desaparece.
 */
export function applyOrder(
  builder: SelectQueryBuilder<Dream>,
  sort: DreamSortField,
  order: 'asc' | 'desc',
): void {
  const direction = order === 'asc' ? 'ASC' : 'DESC';
  // `NULLS FIRST` no existe en SQLite: la cláusula se pone solo en Postgres.
  builder.orderBy(SORT_SQL[sort], direction, nullsFor(direction));
  builder.addOrderBy('dream.id', direction);
}
