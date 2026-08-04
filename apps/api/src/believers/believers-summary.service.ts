import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BELIEVER_STATUSES,
  startOfMonth,
  type BelieversSummary,
  type IsoDate,
} from '@navis/shared';
import { Repository } from 'typeorm';

import { asDay } from '../database/date-sql';
import { NEEDS_ATTENTION } from './believer-alert.sql';
import { Believer } from './believer.entity';

/**
 * Las cuentas de la cabecera (RFC 0003 §6.2).
 *
 * Una sola consulta con condicionales, y no cinco: alimentan las pastillas de
 * filtro, se piden con el listado y se invalidan con él. La métrica es la
 * navegación, no un panel de indicadores (§7.1).
 */
@Injectable()
export class BelieversSummaryService {
  constructor(@InjectRepository(Believer) private readonly believers: Repository<Believer>) {}

  async of(churchId: string, today: IsoDate): Promise<BelieversSummary> {
    const builder = this.believers
      .createQueryBuilder('believer')
      .where('believer.churchId = :churchId', { churchId })
      .select('COUNT(*)', 'total')
      .addSelect(`SUM(CASE WHEN ${NEEDS_ATTENTION} THEN 1 ELSE 0 END)`, 'attention')
      .addSelect(
        `SUM(CASE WHEN ${asDay('believer.created_at')} >= ${asDay(':monthStart')} THEN 1 ELSE 0 END)`,
        'fresh',
      )
      .setParameters({ today, monthStart: startOfMonth(today) });

    // Los estados salen de la constante: uno nuevo aparece aquí solo.
    for (const status of BELIEVER_STATUSES) {
      builder.addSelect(`SUM(CASE WHEN believer.status = :st_${status} THEN 1 ELSE 0 END)`, status);
      builder.setParameter(`st_${status}`, status);
    }

    const row = await builder.getRawOne<Record<string, string | number | null>>();
    const count = (key: string): number => Number(row?.[key] ?? 0);

    return {
      total: count('total'),
      byStatus: {
        activo: count('activo'),
        nuevo: count('nuevo'),
        inactivo: count('inactivo'),
        trasladado: count('trasladado'),
      },
      needsAttention: count('attention'),
      newThisMonth: count('fresh'),
    };
  }
}
