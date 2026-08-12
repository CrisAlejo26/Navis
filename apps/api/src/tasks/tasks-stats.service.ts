import { Injectable } from '@nestjs/common';
import { addDays, STREAK_STATS_DAYS, type TaskStats } from '@navis/shared';

import { byPriority, byTag, byWeek, streak90, trend } from './task-stats';
import { TasksExpansionService } from './tasks-expansion.service';
import { TasksStreakService } from './tasks-streak.service';

/** Las cuentas de «Estadísticas» (RFC 0018 §9.4). */
@Injectable()
export class TasksStatsService {
  constructor(
    private readonly expansion: TasksExpansionService,
    private readonly streak: TasksStreakService,
  ) {}

  async stats(
    churchId: string,
    ownerId: string,
    today: string,
    from: string,
    to: string,
  ): Promise<TaskStats> {
    const streak90From = addDays(today, -(STREAK_STATS_DAYS - 1));

    const [rangeItems, streak90Items, streakResult] = await Promise.all([
      this.expansion.range(churchId, ownerId, from, to),
      this.expansion.range(churchId, ownerId, streak90From, today),
      this.streak.streak(churchId, ownerId, today),
    ]);

    const weeks = byWeek(rangeItems, from, to);

    return {
      byWeek: weeks,
      byPriority: byPriority(rangeItems),
      byTag: byTag(rangeItems),
      trend: trend(weeks),
      streak90: streak90(streak90Items, streak90From, today),
      currentStreak: streakResult.current,
      longestStreak: streakResult.longest,
    };
  }
}
