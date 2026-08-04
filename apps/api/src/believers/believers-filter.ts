import type { BelieversQuery, IsoDate } from '@navis/shared';
import type { SelectQueryBuilder } from 'typeorm';

import { NEEDS_ATTENTION } from './believer-alert.sql';
import type { Believer } from './believer.entity';

/** Por qué columna ordena cada campo del listado (RFC 0003 §6.1). */
export const SORT_COLUMN = {
  name: 'believer.searchName',
  status: 'believer.status',
  lastNote: 'believer.lastNoteAt',
  createdAt: 'believer.createdAt',
} as const;

/**
 * Los seis filtros del listado, sin orden ni paginación.
 *
 * Está fuera del servicio y sin repositorios: es una transformación del
 * `QueryBuilder`, se lee de una vez y no necesita nada más (Regla 6 §2).
 */
export function applyFilters(
  builder: SelectQueryBuilder<Believer>,
  query: BelieversQuery,
  today: IsoDate,
): SelectQueryBuilder<Believer> {
  builder.setParameter('today', today);

  if (query.search) {
    builder.andWhere('believer.searchName LIKE :search', { search: `%${query.search}%` });
  }

  if (query.status?.length) {
    builder.andWhere('believer.status IN (:...statuses)', { statuses: [...query.status] });
  }

  // Los identificadores vacíos ya no llegan hasta aquí —el DTO los valida como
  // UUID—: un `IN ('')` contra una columna `uuid` revienta en Postgres.
  if (query.congregationId) {
    builder.andWhere('believer.congregationId = :congregationId', {
      congregationId: query.congregationId,
    });
  }

  if (query.giftId) {
    builder.andWhere(
      `EXISTS (SELECT 1 FROM believer_gifts g
               WHERE g.believer_id = believer.id AND g.gift_id = :giftId AND g.deleted_at IS NULL)`,
      { giftId: query.giftId },
    );
  }

  if (query.attention) builder.andWhere(`(${NEEDS_ATTENTION})`);

  return builder;
}
