import { Injectable } from '@nestjs/common';
import type { TeachingsStats } from '@navis/shared';

import { toIsoDay } from '../database/iso-day';
import { summarizeTeachings } from './teaching-stats';
import { TeachingsRepository } from './teachings.repository';

/** Las cuentas de la portada (RFC 0022 §4.4). */
@Injectable()
export class TeachingStatsService {
  constructor(private readonly teachings: TeachingsRepository) {}

  async stats(ownerId: string): Promise<TeachingsStats> {
    const rows = await this.teachings.all(ownerId);
    return summarizeTeachings(
      rows.map((row) => ({ receivedAt: toIsoDay(row.receivedAt), bodyJson: row.bodyJson })),
      toIsoDay(new Date()),
    );
  }
}
