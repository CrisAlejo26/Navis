import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { taskAppliesOn, isoDateSchema, type TaskStatus } from '@navis/shared';
import { Repository } from 'typeorm';

import { TaskOccurrence } from './task-occurrence.entity';
import { Task } from './task.entity';
import { TasksService } from './tasks.service';

/**
 * Cambiar el estado de un día concreto de una tarea (RFC 0018 §8.1, D3, D4).
 * Idempotente: se puede llamar dos veces con el mismo estado sin duplicar
 * nada, gracias al índice único `(task_id, date)`.
 */
@Injectable()
export class TasksOccurrenceService {
    constructor(
        @InjectRepository(Task) private readonly tasks: Repository<Task>,
        @InjectRepository(TaskOccurrence) private readonly occurrences: Repository<TaskOccurrence>,
        private readonly tasksService: TasksService,
    ) {}

    async setStatus(
        churchId: string,
        ownerId: string,
        taskId: string,
        date: string,
        status: TaskStatus,
    ): Promise<void> {
        const task = await this.tasksService.require(churchId, ownerId, taskId);
        if (!isoDateSchema.safeParse(date).success)
            throw new UnprocessableEntityException('invalid-date');
        const completedAt = status === 'completada' ? new Date() : null;

        if (!task.isRecurring) {
            if (date !== task.date) throw new UnprocessableEntityException('invalid-occurrence');
            task.status = status;
            task.completedAt = completedAt;
            await this.tasks.save(task);
            return;
        }

        let occurrence = await this.occurrences.findOne({ where: { taskId, date } });
        if (!occurrence && !taskAppliesOn(task, date))
            throw new UnprocessableEntityException('invalid-occurrence');
        occurrence ??= this.occurrences.create({ taskId, date });
        occurrence.status = status;
        occurrence.completedAt = completedAt;
        await this.occurrences.save(occurrence);
    }
}
