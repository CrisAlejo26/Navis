import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { HabitStatus } from '@navis/shared';
import { Repository } from 'typeorm';

import { HabitOccurrence } from './habit-occurrence.entity';
import { Habit } from './habit.entity';
import { HabitsService } from './habits.service';

/** Cambiar el estado de un día de un hábito, con los dos estados de D5. */
@Injectable()
export class HabitsOccurrenceService {
  constructor(
    @InjectRepository(Habit) private readonly habits: Repository<Habit>,
    @InjectRepository(HabitOccurrence) private readonly occurrences: Repository<HabitOccurrence>,
    private readonly habitsService: HabitsService,
  ) {}

  async setStatus(
    churchId: string,
    ownerId: string,
    habitId: string,
    date: string,
    status: HabitStatus,
  ): Promise<void> {
    const habit = await this.habitsService.require(churchId, ownerId, habitId);
    const completedAt = status === 'completada' ? new Date() : null;

    if (habit.repeatFreq === 'ninguna') {
      habit.status = status;
      habit.completedAt = completedAt;
      await this.habits.save(habit);
      return;
    }

    let occurrence = await this.occurrences.findOne({ where: { habitId, date } });
    occurrence ??= this.occurrences.create({ habitId, date });
    occurrence.status = status;
    occurrence.completedAt = completedAt;
    await this.occurrences.save(occurrence);
  }
}
