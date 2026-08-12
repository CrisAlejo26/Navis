import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { eachDay, type TagRef, type TaskOccurrence, type TaskReminder } from '@navis/shared';
import { Between, In, Repository } from 'typeorm';

import { taskAppliesOn } from './task-recurrence';
import { TaskOccurrence as TaskOccurrenceEntity } from './task-occurrence.entity';
import { TaskReminderTag } from './task-reminder-tag.entity';
import { TaskReminder as TaskReminderEntity } from './task-reminder.entity';
import { TaskTag } from './task-tag.entity';
import { Task } from './task.entity';

/**
 * La expansión de tareas: el rango pedido, con las repetitivas calculadas al
 * vuelo y combinadas con lo ya materializado (RFC 0018 §5.4, D3). Misma
 * operación que `ScheduleService.range` del calendario, para tareas.
 */
@Injectable()
export class TasksExpansionService {
  constructor(
    @InjectRepository(Task) private readonly tasks: Repository<Task>,
    @InjectRepository(TaskOccurrenceEntity)
    private readonly occurrences: Repository<TaskOccurrenceEntity>,
    @InjectRepository(TaskTag) private readonly taskTags: Repository<TaskTag>,
    @InjectRepository(TaskReminderEntity)
    private readonly reminders: Repository<TaskReminderEntity>,
  ) {}

  /** Las tareas del rango, expandidas y ordenadas por fecha y hora. */
  async range(
    churchId: string,
    ownerId: string,
    from: string,
    to: string,
  ): Promise<TaskOccurrence[]> {
    const templates = await this.templatesActiveIn(churchId, ownerId, from, to);
    if (templates.length === 0) return [];

    const ids = templates.map((task) => task.id);
    const [materialized, tagsByTask, remindersByTask] = await Promise.all([
      this.occurrences.find({ where: { taskId: In(ids), date: Between(from, to) } }),
      this.tagsFor(ids),
      this.remindersFor(ids),
    ]);
    const byKey = new Map(materialized.map((row) => [`${row.taskId}:${row.date}`, row]));

    const result: TaskOccurrence[] = [];
    for (const date of eachDay(from, to)) {
      for (const task of templates) {
        if (!taskAppliesOn(task, date)) continue;
        const materializedRow = task.isRecurring ? byKey.get(`${task.id}:${date}`) : undefined;

        // Una tarea borrada ya no propone nada hacia adelante (D18): solo
        // sigue enseñando lo que ya estaba materializado. Una no repetitiva
        // es su propia ocurrencia (D4), así que su único día siempre cuenta.
        const isMaterialized = task.isRecurring ? Boolean(materializedRow) : true;
        if (task.deletedAt && !isMaterialized) continue;

        result.push(
          toView(
            task,
            date,
            materializedRow,
            tagsByTask.get(task.id) ?? [],
            remindersByTask.get(task.id) ?? null,
          ),
        );
      }
    }

    return result.sort(byDateThenTime);
  }

  /** Un solo día: lo que usa el cálculo de racha y la portada «Hoy». */
  day(churchId: string, ownerId: string, date: string): Promise<TaskOccurrence[]> {
    return this.range(churchId, ownerId, date, date);
  }

  /**
   * Las plantillas que pueden proponer algo dentro del tramo: su `date` no es
   * posterior a `to`, y o es repetitiva o su `date` no es anterior a `from`
   * (una no repetitiva con `date` antes de `from` nunca cae en el tramo).
   */
  private templatesActiveIn(
    churchId: string,
    ownerId: string,
    from: string,
    to: string,
  ): Promise<Task[]> {
    // `withDeleted`: una tarea borrada sigue enseñando lo ya materializado
    // (D18), y eso se filtra fila a fila más abajo.
    return this.tasks
      .createQueryBuilder('task')
      .withDeleted()
      .where('task.churchId = :churchId', { churchId })
      .andWhere('task.ownerId = :ownerId', { ownerId })
      .andWhere('task.date <= :to', { to })
      .andWhere('(task.isRecurring = :isRecurring OR task.date >= :from)', {
        isRecurring: true,
        from,
      })
      .getMany();
  }

  private async tagsFor(taskIds: string[]): Promise<Map<string, TagRef[]>> {
    const links = await this.taskTags.find({
      where: { taskId: In(taskIds) },
      relations: { tag: true },
    });
    const byTask = new Map<string, TagRef[]>();
    for (const link of links) {
      const list = byTask.get(link.taskId) ?? [];
      list.push({
        id: link.tag.id,
        name: link.tag.name,
        icon: link.tag.icon,
        accent: link.tag.accent,
      });
      byTask.set(link.taskId, list);
    }
    return byTask;
  }

  private async remindersFor(taskIds: string[]): Promise<Map<string, TaskReminder>> {
    const rows = await this.reminders.find({
      where: { taskId: In(taskIds) },
      relations: { tags: { tag: true } },
    });
    return new Map(
      rows.map((row) => [
        row.taskId,
        {
          enabled: row.enabled,
          remindAt: row.remindAt.toISOString(),
          tags: row.tags.map((link) => ({
            id: link.tag.id,
            name: link.tag.name,
            icon: link.tag.icon,
            accent: link.tag.accent,
          })),
        },
      ]),
    );
  }
}

function toView(
  task: Task,
  date: string,
  materialized: TaskOccurrenceEntity | undefined,
  tags: TagRef[],
  reminder: TaskReminder | null,
): TaskOccurrence {
  const status = task.isRecurring
    ? (materialized?.status ?? 'pendiente')
    : (task.status ?? 'pendiente');
  const completedAt = task.isRecurring
    ? (materialized?.completedAt?.toISOString() ?? null)
    : (task.completedAt?.toISOString() ?? null);

  return {
    taskId: task.id,
    date,
    title: task.title,
    description: task.description,
    time: task.time,
    priority: task.priority,
    status,
    completedAt,
    isRecurring: task.isRecurring,
    tags,
    reminder,
    createdAt: task.createdAt.toISOString(),
  };
}

function byDateThenTime(a: TaskOccurrence, b: TaskOccurrence): number {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  if (a.time !== b.time)
    return a.time === null ? 1 : b.time === null ? -1 : a.time.localeCompare(b.time);
  return a.title.localeCompare(b.title);
}
