import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { ProphecyExportRow, ProphecyListItem } from '@navis/shared';
import { In, Repository } from 'typeorm';

import { toIsoDay } from '../database/iso-day';
import { toExportRow, toListItem } from './prophecies.mapper';
import { ProphecyFulfillment } from './prophecy-fulfillment.entity';
import type { Prophecy } from './prophecy.entity';

/**
 * De filas de `prophecies` a lo que consume la interfaz, en sus dos formas: la
 * del listado (con extracto) y la de la exportación (con el cuerpo entero).
 *
 * Está aparte porque las dos necesitan **lo mismo** de la base de datos —los
 * días de cada cumplimiento parcial— y pedirlo dos veces desde dos servicios
 * era la forma segura de que un día dejaran de coincidir (RFC 0009 D7).
 */
@Injectable()
export class ProphecyRowsService {
  constructor(
    @InjectRepository(ProphecyFulfillment)
    private readonly fulfillments: Repository<ProphecyFulfillment>,
  ) {}

  async listItems(rows: readonly Prophecy[], today: string): Promise<ProphecyListItem[]> {
    const days = await this.daysOf(rows.map((one) => one.id));
    return rows.map((row) => toListItem(row, today, days.get(row.id) ?? []));
  }

  async exportRows(rows: readonly Prophecy[], today: string): Promise<ProphecyExportRow[]> {
    const days = await this.daysOf(rows.map((one) => one.id));
    return rows.map((row) => toExportRow(row, today, days.get(row.id) ?? []));
  }

  /**
   * Los días de cada cumplimiento, agrupados por profecía y de una sola
   * consulta, ya con los identificadores del lote.
   *
   * Se traen las fechas y no un `COUNT` porque son las **marcas de la
   * travesía** (RFC 0004 §7.5), y de paso el número sale de contarlas.
   */
  private async daysOf(ids: readonly string[]): Promise<Map<string, string[]>> {
    // Un `IN ('')` contra una columna `uuid` revienta en Postgres (CLAUDE.md):
    // los identificadores vacíos se filtran antes de la consulta.
    const unique = [...new Set(ids)].filter(Boolean);
    if (unique.length === 0) return new Map();

    const rows = await this.fulfillments.find({
      where: { prophecyId: In(unique) },
      select: { prophecyId: true, occurredAt: true },
      order: { occurredAt: 'ASC' },
    });

    const grouped = new Map<string, string[]>();
    for (const row of rows) {
      const days = grouped.get(row.prophecyId) ?? [];
      days.push(toIsoDay(row.occurredAt));
      grouped.set(row.prophecyId, days);
    }

    return grouped;
  }
}
