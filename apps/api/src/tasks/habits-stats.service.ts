import { Injectable } from '@nestjs/common';
import type { HabitStats } from '@navis/shared';

import { HabitsExpansionService } from './habits-expansion.service';
import { byTag, byWeek, trend } from './habit-stats';

/** Las cuentas de cumplimiento de hábitos (RFC 0018 §9.4). Sin racha (D19). */
@Injectable()
export class HabitsStatsService {
  constructor(private readonly expansion: HabitsExpansionService) {}

  async stats(churchId: string, ownerId: string, from: string, to: string): Promise<HabitStats> {
    const items = await this.expansion.range(churchId, ownerId, from, to);
    const weeks = byWeek(items, from, to);

    return { byWeek: weeks, byTag: byTag(items), trend: trend(weeks) };
  }
}
