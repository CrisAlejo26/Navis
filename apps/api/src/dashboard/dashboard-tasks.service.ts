import { Injectable } from '@nestjs/common';
import { DASHBOARD_TASKS_PREVIEW, type DashboardTask, type IsoDate } from '@navis/shared';

import { TasksExpansionService } from '../tasks/tasks-expansion.service';
import { TasksStreakService } from '../tasks/tasks-streak.service';

/**
 * Las tareas de hoy y la racha, para la tarjeta del panel de inicio (RFC
 * 0018 §9.7). Reutiliza la expansión y el cálculo de racha del propio
 * módulo de tareas, sin una segunda petición al servidor.
 */
@Injectable()
export class DashboardTasksService {
  constructor(
    private readonly expansion: TasksExpansionService,
    private readonly streak: TasksStreakService,
  ) {}

  async today(
    churchId: string,
    ownerId: string,
    today: IsoDate,
  ): Promise<{ tasks: DashboardTask[]; streak: number }> {
    const [items, streakResult] = await Promise.all([
      this.expansion.day(churchId, ownerId, today),
      this.streak.streak(churchId, ownerId, today),
    ]);

    const tasks: DashboardTask[] = items.slice(0, DASHBOARD_TASKS_PREVIEW).map((item) => ({
      taskId: item.taskId,
      title: item.title,
      time: item.time,
      priority: item.priority,
      completed: item.status === 'completada',
      accent: item.tags[0]?.accent ?? 'primary',
    }));

    return { tasks, streak: streakResult.current };
  }
}
