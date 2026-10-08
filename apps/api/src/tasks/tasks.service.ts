import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { taskRepeatOptionsSchema, validTaskRepeat, type Task as TaskView } from '@navis/shared';
import { Repository } from 'typeorm';

import type { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import { TagsService } from './tags.service';
import { WorkflowsService } from './workflows.service';
import { TaskReminderTag } from './task-reminder-tag.entity';
import { TaskReminder } from './task-reminder.entity';
import { TaskTag } from './task-tag.entity';
import { Task } from './task.entity';

/**
 * La plantilla de una tarea (RFC 0018 §5.2, §8): crear, editar y borrar. La
 * expansión y el estado de cada día viven en `TasksExpansionService` y
 * `TasksOccurrenceService` (D3, D4).
 */
@Injectable()
export class TasksService {
    constructor(
        @InjectRepository(Task) private readonly tasks: Repository<Task>,
        @InjectRepository(TaskTag) private readonly taskTags: Repository<TaskTag>,
        @InjectRepository(TaskReminder) private readonly reminders: Repository<TaskReminder>,
        @InjectRepository(TaskReminderTag)
        private readonly reminderTags: Repository<TaskReminderTag>,
        private readonly tags: TagsService,
        private readonly workflows: WorkflowsService,
    ) {}

    async require(churchId: string, ownerId: string, id: string): Promise<Task> {
        const task = await this.tasks.findOne({ where: { id, churchId, ownerId } });
        if (!task) throw new NotFoundException('Esa tarea no existe');
        return task;
    }

    /** Como `require`, pero también una tarea borrada: su tiempo trabajado se conserva (D18). */
    findAny(churchId: string, ownerId: string, id: string): Promise<Task | null> {
        return this.tasks.findOne({ where: { id, churchId, ownerId }, withDeleted: true });
    }

    async requireAny(churchId: string, ownerId: string, id: string): Promise<Task> {
        const task = await this.findAny(churchId, ownerId, id);
        if (!task) throw new NotFoundException('Esa tarea no existe');
        return task;
    }

    async create(churchId: string, ownerId: string, dto: CreateTaskDto): Promise<Task> {
        if (dto.repeatOptions && !taskRepeatOptionsSchema.safeParse(dto.repeatOptions).success)
            throw new UnprocessableEntityException('Revisa los días de repetición');
        if (!validTaskRepeat(dto))
            throw new UnprocessableEntityException('Revisa los días de repetición');
        checkRepeat(
            dto.isRecurring,
            dto.repeatFreq,
            dto.repeatEndType,
            dto.repeatEndDate,
            dto.repeatEndCount,
        );
        checkLimit(dto.isRecurring, dto.date, dto.dueDate, dto.inProgressDeadline);
        await this.tags.requireAll(churchId, ownerId, [...dto.tagIds, ...dto.reminderTagIds]);
        await this.workflows.requireOrNone(churchId, ownerId, dto.workflowId);

        const task = await this.tasks.save(
            this.tasks.create({
                churchId,
                ownerId,
                title: dto.title,
                description: dto.description ?? null,
                date: dto.date,
                time: dto.time ?? null,
                priority: dto.priority,
                status: dto.isRecurring ? null : 'pendiente',
                completedAt: null,
                isRecurring: dto.isRecurring,
                repeatFreq: dto.isRecurring ? (dto.repeatFreq ?? null) : null,
                repeatInterval: dto.repeatInterval,
                repeatOptions: dto.isRecurring ? (dto.repeatOptions ?? null) : null,
                repeatEndType: dto.isRecurring ? (dto.repeatEndType ?? 'nunca') : null,
                repeatEndDate: dto.repeatEndType === 'fecha' ? (dto.repeatEndDate ?? null) : null,
                repeatEndCount:
                    dto.repeatEndType === 'cantidad' ? (dto.repeatEndCount ?? null) : null,
                workflowId: dto.workflowId ?? null,
                dueDate: dto.dueDate ?? null,
                inProgressDeadline: dto.inProgressDeadline
                    ? new Date(dto.inProgressDeadline)
                    : null,
            }),
        );

        await this.setTags(task.id, dto.tagIds);
        await this.setReminder(
            task.id,
            dto.reminderEnabled,
            dto.reminderAt ?? defaultReminder(dto.date, dto.time ?? null),
            dto.reminderTagIds,
        );

        return task;
    }

    async update(churchId: string, ownerId: string, id: string, dto: UpdateTaskDto): Promise<Task> {
        const task = await this.require(churchId, ownerId, id);
        const isRecurring = dto.isRecurring ?? task.isRecurring;
        if (dto.repeatOptions && !taskRepeatOptionsSchema.safeParse(dto.repeatOptions).success)
            throw new UnprocessableEntityException('Revisa los días de repetición');
        if (!validTaskRepeat({ ...task, ...dto, isRecurring }))
            throw new UnprocessableEntityException('Revisa los días de repetición');
        checkRepeat(
            isRecurring,
            dto.repeatFreq ?? task.repeatFreq ?? undefined,
            dto.repeatEndType ?? task.repeatEndType ?? undefined,
            dto.repeatEndDate ?? task.repeatEndDate ?? undefined,
            dto.repeatEndCount ?? task.repeatEndCount ?? undefined,
        );

        const dueDate = dto.dueDate === undefined ? task.dueDate : dto.dueDate;
        const deadline =
            dto.inProgressDeadline === undefined
                ? (task.inProgressDeadline?.toISOString() ?? null)
                : dto.inProgressDeadline;
        checkLimit(isRecurring, dto.date ?? task.date, dueDate, deadline);

        const tagIds = [...(dto.tagIds ?? []), ...(dto.reminderTagIds ?? [])];
        if (tagIds.length > 0) await this.tags.requireAll(churchId, ownerId, tagIds);
        if (dto.workflowId !== undefined) {
            await this.workflows.requireOrNone(churchId, ownerId, dto.workflowId);
            task.workflowId = dto.workflowId;
        }

        if (dto.title !== undefined) task.title = dto.title;
        if (dto.description !== undefined) task.description = dto.description ?? null;
        if (dto.date !== undefined) task.date = dto.date;
        if (dto.time !== undefined) task.time = dto.time;
        if (dto.priority !== undefined) task.priority = dto.priority;
        if (dto.isRecurring !== undefined) task.isRecurring = dto.isRecurring;
        task.repeatFreq = isRecurring ? (dto.repeatFreq ?? task.repeatFreq) : null;
        task.repeatInterval = dto.repeatInterval ?? task.repeatInterval;
        if (dto.repeatOptions !== undefined) task.repeatOptions = dto.repeatOptions;
        if (!isRecurring) task.repeatOptions = null;
        const endType = isRecurring ? (dto.repeatEndType ?? task.repeatEndType ?? 'nunca') : null;
        task.repeatEndType = endType;
        task.repeatEndDate = endType === 'fecha' ? (dto.repeatEndDate ?? task.repeatEndDate) : null;
        task.repeatEndCount =
            endType === 'cantidad' ? (dto.repeatEndCount ?? task.repeatEndCount) : null;
        if (!isRecurring && task.status === null) task.status = 'pendiente';
        // Una serie no tiene límite: convertir una tarea en serie lo borra.
        task.dueDate = isRecurring ? null : dueDate;
        task.inProgressDeadline = isRecurring || !deadline ? null : new Date(deadline);

        await this.tasks.save(task);
        if (dto.tagIds) await this.setTags(task.id, dto.tagIds);
        if (
            dto.reminderEnabled !== undefined ||
            dto.reminderAt !== undefined ||
            dto.reminderTagIds
        ) {
            await this.setReminder(
                task.id,
                dto.reminderEnabled ?? true,
                dto.reminderAt ?? defaultReminder(task.date, task.time),
                dto.reminderTagIds ?? [],
            );
        }

        return task;
    }

    async remove(churchId: string, ownerId: string, id: string): Promise<void> {
        const task = await this.require(churchId, ownerId, id);
        await this.tasks.softRemove(task);
    }

    /** La plantilla entera, con sus etiquetas y su recordatorio (§9.6). */
    async view(churchId: string, ownerId: string, id: string): Promise<TaskView> {
        const task = await this.require(churchId, ownerId, id);
        const [tagLinks, reminder, workflows] = await Promise.all([
            this.taskTags.find({ where: { taskId: task.id }, relations: { tag: true } }),
            this.reminders.findOne({
                where: { taskId: task.id },
                relations: { tags: { tag: true } },
            }),
            this.workflows.refs(task.workflowId ? [task.workflowId] : []),
        ]);

        return {
            id: task.id,
            title: task.title,
            description: task.description,
            date: task.date,
            time: task.time,
            priority: task.priority,
            isRecurring: task.isRecurring,
            repeatFreq: task.repeatFreq,
            repeatInterval: task.repeatInterval,
            repeatEndType: task.repeatEndType,
            repeatEndDate: task.repeatEndDate,
            repeatEndCount: task.repeatEndCount,
            repeatOptions: task.repeatOptions,
            repeatPauses: task.repeatPauses,
            repeatStoppedAt: task.repeatStoppedAt,
            manualOrder: task.manualOrder,
            dueDate: task.dueDate,
            inProgressDeadline: task.inProgressDeadline?.toISOString() ?? null,
            workflow: (task.workflowId && workflows.get(task.workflowId)) || null,
            status: task.status,
            completedAt: task.completedAt?.toISOString() ?? null,
            tags: tagLinks.map((link) => ({
                id: link.tag.id,
                name: link.tag.name,
                icon: link.tag.icon,
                accent: link.tag.accent,
            })),
            reminder: reminder
                ? {
                      enabled: reminder.enabled,
                      remindAt: reminder.remindAt.toISOString(),
                      tags: reminder.tags.map((link) => ({
                          id: link.tag.id,
                          name: link.tag.name,
                          icon: link.tag.icon,
                          accent: link.tag.accent,
                      })),
                  }
                : null,
        };
    }

    private async setTags(taskId: string, tagIds: string[]): Promise<void> {
        await this.taskTags.delete({ taskId });
        if (tagIds.length > 0) {
            await this.taskTags.save(
                tagIds.map((tagId) => this.taskTags.create({ taskId, tagId })),
            );
        }
    }

    private async setReminder(
        taskId: string,
        enabled: boolean,
        remindAt: string,
        tagIds: string[],
    ): Promise<void> {
        let reminder = await this.reminders.findOne({ where: { taskId } });
        if (reminder) {
            reminder.enabled = enabled;
            reminder.remindAt = new Date(remindAt);
            reminder = await this.reminders.save(reminder);
        } else {
            reminder = await this.reminders.save(
                this.reminders.create({ taskId, enabled, remindAt: new Date(remindAt) }),
            );
        }

        await this.reminderTags.delete({ reminderId: reminder.id });
        if (tagIds.length > 0) {
            await this.reminderTags.save(
                tagIds.map((tagId) => this.reminderTags.create({ reminderId: reminder.id, tagId })),
            );
        }
    }
}

/** `date`+`time` de la tarea, o las nueve de la mañana si no tiene hora. */
function defaultReminder(date: string, time: string | null): string {
    return `${date}T${time ?? '09:00'}`;
}

/** Una serie no tiene límite, y el límite no puede ser anterior al día de la tarea. */
function checkLimit(
    isRecurring: boolean,
    date: string,
    dueDate: string | null | undefined,
    deadline: string | null | undefined,
): void {
    if (isRecurring && (dueDate || deadline))
        throw new UnprocessableEntityException('Una serie no tiene fecha límite');
    if (dueDate && dueDate < date)
        throw new UnprocessableEntityException(
            'El límite no puede ser anterior al día de la tarea',
        );
}

function checkRepeat(
    isRecurring: boolean,
    repeatFreq: string | undefined,
    repeatEndType: string | undefined,
    repeatEndDate: string | undefined,
    repeatEndCount: number | undefined,
): void {
    if (isRecurring && !repeatFreq) {
        throw new UnprocessableEntityException('Una tarea repetitiva necesita una frecuencia');
    }
    if (repeatEndType === 'fecha' && !repeatEndDate) {
        throw new UnprocessableEntityException('Falta hasta cuándo se repite');
    }
    if (repeatEndType === 'cantidad' && !repeatEndCount) {
        throw new UnprocessableEntityException('Falta cuántas veces se repite');
    }
}
