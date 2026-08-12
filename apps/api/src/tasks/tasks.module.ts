import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ChurchesModule } from '../churches/churches.module';
import { HabitOccurrence } from './habit-occurrence.entity';
import { HabitReminderTag } from './habit-reminder-tag.entity';
import { HabitReminder } from './habit-reminder.entity';
import { HabitTag } from './habit-tag.entity';
import { Habit } from './habit.entity';
import { HabitsController } from './habits.controller';
import { HabitsExpansionService } from './habits-expansion.service';
import { HabitsListService } from './habits-list.service';
import { HabitsOccurrenceService } from './habits-occurrence.service';
import { HabitsStatsService } from './habits-stats.service';
import { HabitsService } from './habits.service';
import { Tag } from './tag.entity';
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';
import { TaskOccurrence } from './task-occurrence.entity';
import { TaskReminderTag } from './task-reminder-tag.entity';
import { TaskReminder } from './task-reminder.entity';
import { TaskStreakCache } from './task-streak-cache.entity';
import { TaskTag } from './task-tag.entity';
import { Task } from './task.entity';
import { TasksController } from './tasks.controller';
import { TasksExpansionService } from './tasks-expansion.service';
import { TasksListService } from './tasks-list.service';
import { TasksOccurrenceService } from './tasks-occurrence.service';
import { TasksStatsService } from './tasks-stats.service';
import { TasksStreakService } from './tasks-streak.service';
import { TasksService } from './tasks.service';

/**
 * Tareas y hábitos (RFC 0018). Importa `ChurchesModule` por
 * `ChurchClockService`: «hoy» siempre es el día local de la iglesia (D16),
 * no el del servidor.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tag,
      Task,
      TaskTag,
      TaskOccurrence,
      TaskReminder,
      TaskReminderTag,
      TaskStreakCache,
      Habit,
      HabitTag,
      HabitOccurrence,
      HabitReminder,
      HabitReminderTag,
    ]),
    ChurchesModule,
  ],
  controllers: [TagsController, TasksController, HabitsController],
  providers: [
    TagsService,
    TasksService,
    TasksExpansionService,
    TasksListService,
    TasksOccurrenceService,
    TasksStreakService,
    TasksStatsService,
    HabitsService,
    HabitsExpansionService,
    HabitsListService,
    HabitsOccurrenceService,
    HabitsStatsService,
  ],
  // La tarjeta de tareas de hoy del panel de inicio (RFC 0018 §9.7) reutiliza
  // la expansión y la racha en vez de duplicarlas.
  exports: [TasksExpansionService, TasksStreakService],
})
export class TasksModule {}
