import { Injectable } from '@nestjs/common';
import type { PropheciesStats } from '@navis/shared';

import { toIsoDay } from '../database/iso-day';
import { PropheciesRepository } from './prophecies.repository';
import { summarize, type StatsRow } from './prophecy-stats';

/**
 * Las cuentas de la portada (RFC 0004 §6.2).
 *
 * Se piden **todas** las filas de esa persona, pero solo las cinco columnas que
 * hacen falta: ni el cuerpo ni el texto de búsqueda, que es lo que pesa. Las
 * cuentas no pueden derivarse del listado paginado — la página 1 no sabe nada de
 * las otras cuatrocientas (D14).
 */
@Injectable()
export class ProphecyStatsService {
  constructor(private readonly prophecies: PropheciesRepository) {}

  async stats(ownerId: string): Promise<PropheciesStats> {
    const rows = await this.prophecies
      .scoped(ownerId)
      .select([
        'prophecy.id',
        'prophecy.title',
        'prophecy.receivedAt',
        'prophecy.fulfilledAt',
        'prophecy.lastFulfillmentAt',
      ])
      .getMany();

    return summarize(rows.map(toStatsRow), toIsoDay(new Date()));
  }
}

/** Las fechas, como día de calendario: desde Postgres pueden venir como `Date`. */
function toStatsRow(row: {
  id: string;
  title: string;
  receivedAt: string;
  fulfilledAt: string | null;
  lastFulfillmentAt: string | null;
}): StatsRow {
  return {
    id: row.id,
    title: row.title,
    receivedAt: toIsoDay(row.receivedAt),
    fulfilledAt: row.fulfilledAt ? toIsoDay(row.fulfilledAt) : null,
    lastFulfillmentAt: row.lastFulfillmentAt ? toIsoDay(row.lastFulfillmentAt) : null,
  };
}
