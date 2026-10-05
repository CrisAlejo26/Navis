import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { addDays, STREAK_LOOKBACK_DAYS, currentTaskStreak, type TaskStreak } from '@navis/shared';
import { Repository } from 'typeorm';

import { TaskStreakCache } from './task-streak-cache.entity';
import { TasksExpansionService } from './tasks-expansion.service';

/**
 * La racha de tareas (RFC 0018 §6, D8, D9). Se calcula en cada lectura,
 * recorriendo hacia atrás desde ayer; solo se guarda el máximo, que
 * únicamente puede crecer.
 *
 * Una sola expansión para todo el tramo —no un día a la vez—, o el cálculo
 * fueran hasta 400 idas y vueltas a la base de datos.
 */
@Injectable()
export class TasksStreakService {
    constructor(
        @InjectRepository(TaskStreakCache) private readonly cache: Repository<TaskStreakCache>,
        private readonly expansion: TasksExpansionService,
    ) {}

    async streak(churchId: string, ownerId: string, today: string): Promise<TaskStreak> {
        const current = await this.currentStreak(churchId, ownerId, today);

        let row = await this.cache.findOne({ where: { churchId, ownerId } });
        if (!row) row = this.cache.create({ churchId, ownerId, longestStreak: 0 });

        if (current > row.longestStreak) {
            row.longestStreak = current;
            row = await this.cache.save(row);
        }

        return { current, longest: Math.max(row.longestStreak, current) };
    }

    /** §6.2: ayer hacia atrás, saltando los días sin ninguna tarea (D8), y hoy aparte. */
    private async currentStreak(churchId: string, ownerId: string, today: string): Promise<number> {
        const from = addDays(today, -STREAK_LOOKBACK_DAYS);
        const occurrences = await this.expansion.range(churchId, ownerId, from, today);

        return currentTaskStreak(occurrences, today);
    }
}
