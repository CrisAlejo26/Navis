import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { JournalStats } from '@navis/shared';
import { Repository } from 'typeorm';

import { toIsoDay } from '../database/iso-day';
import { JournalEntry } from './journal-entry.entity';
import { summarize, type StatsRow } from './journal-stats';

/** Las cuentas de la portada del cuaderno (RFC 0017 §6.2). */
@Injectable()
export class JournalStatsService {
  constructor(@InjectRepository(JournalEntry) private readonly entries: Repository<JournalEntry>) {}

  async stats(churchId: string): Promise<JournalStats> {
    const rows = await this.entries
      .createQueryBuilder('entry')
      .where('entry.churchId = :churchId', { churchId })
      .select([
        'entry.id',
        'entry.kind',
        'entry.occurredAt',
        'entry.remindAt',
        'entry.remindDoneAt',
      ])
      .getMany();

    return summarize(rows.map(toStatsRow), toIsoDay(new Date()));
  }
}

/** Las fechas, como día de calendario: desde Postgres pueden venir como `Date`. */
function toStatsRow(row: JournalEntry): StatsRow {
  return {
    kind: row.kind,
    occurredAt: toIsoDay(row.occurredAt),
    remindAt: row.remindAt ? row.remindAt.toISOString() : null,
    remindDoneAt: row.remindDoneAt ? row.remindDoneAt.toISOString() : null,
  };
}
