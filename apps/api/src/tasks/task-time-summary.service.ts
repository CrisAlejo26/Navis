import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { addDays, summarizeTime, type TaskTimeSummary } from '@navis/shared';
import { Between, In, Repository } from 'typeorm';

import { ChurchClockService } from '../churches/church-clock.service';
import { TaskTimeEntry } from './task-time-entry.entity';
import { Task } from './task.entity';
import { WorkflowsService } from './workflows.service';

/**
 * El tiempo trabajado en un rango, por tarea y por flujo (Fase 7c). Trae las
 * entradas con un día de margen a cada lado —el día de una entrada depende de
 * la zona de la iglesia— y deja que `summarizeTime` (la misma función que usa
 * el móvil) decida cuáles caen dentro.
 */
@Injectable()
export class TaskTimeSummaryService {
    constructor(
        @InjectRepository(TaskTimeEntry) private readonly entries: Repository<TaskTimeEntry>,
        @InjectRepository(Task) private readonly tasks: Repository<Task>,
        private readonly workflows: WorkflowsService,
        private readonly clock: ChurchClockService,
    ) {}

    async summary(
        churchId: string,
        ownerId: string,
        from: string,
        to: string,
    ): Promise<TaskTimeSummary> {
        const rows = await this.entries.find({
            where: {
                churchId,
                ownerId,
                startedAt: Between(
                    new Date(`${addDays(from, -1)}T00:00:00.000Z`),
                    new Date(`${addDays(to, 2)}T00:00:00.000Z`),
                ),
            },
        });
        const taskIds = [...new Set(rows.map((row) => row.taskId))];
        const tasks = taskIds.length
            ? await this.tasks.find({
                  where: { id: In(taskIds), churchId, ownerId },
                  withDeleted: true,
              })
            : [];
        const refs = await this.workflows.refs(
            tasks.flatMap((task) => (task.workflowId ? [task.workflowId] : [])),
        );
        return summarizeTime({
            entries: rows.map((row) => ({
                id: row.id,
                taskId: row.taskId,
                startedAt: row.startedAt.toISOString(),
                endedAt: row.endedAt?.toISOString() ?? null,
            })),
            tasks: tasks.map((task) => ({
                id: task.id,
                title: task.title,
                workflow: task.workflowId ? (refs.get(task.workflowId) ?? null) : null,
            })),
            from,
            to,
            timezone: await this.clock.timezone(churchId),
        });
    }
}
