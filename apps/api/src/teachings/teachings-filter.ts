import { toSearchName, type TeachingSortField } from '@navis/shared';
import type { SelectQueryBuilder } from 'typeorm';

import type { Teaching } from './teaching.entity';

const SORT_SQL: Record<TeachingSortField, string> = {
  received: 'teaching.receivedAt',
  title: 'teaching.title',
};

/** Búsqueda de texto libre, sobre un constructor ya acotado al dueño. */
export function applyTeachingFilters(
  builder: SelectQueryBuilder<Teaching>,
  search: string | undefined,
): void {
  if (!search) return;

  builder.andWhere('teaching.searchText LIKE :search', {
    // La misma normalización con la que se guardó, o dejaría de encontrar.
    search: `%${toSearchName(search)}%`,
  });
}

/**
 * El orden, con el desempate por identificador — sin él, dos enseñanzas del
 * mismo día pueden salir en distinto orden en dos páginas seguidas.
 */
export function applyTeachingOrder(
  builder: SelectQueryBuilder<Teaching>,
  sort: TeachingSortField,
  order: 'asc' | 'desc',
): void {
  const direction = order === 'asc' ? 'ASC' : 'DESC';
  builder.orderBy(SORT_SQL[sort], direction);
  builder.addOrderBy('teaching.id', direction);
}
