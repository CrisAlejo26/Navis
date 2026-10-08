import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
    closedSeconds,
    type RunningTimer,
    type TaskTime,
    type TaskTimeEntry as TaskTimeEntryView,
} from '@navis/shared';
import { IsNull, Repository } from 'typeorm';

import { TaskTimeEntry } from './task-time-entry.entity';
import { TasksService } from './tasks.service';

const MAX_ENTRIES = 200;

/**
 * El cronómetro de las tareas (Fase 7c). Una persona tiene un solo cronómetro
 * en marcha: empezar otro detiene el anterior, y empezar el mismo no hace nada
 * (la segunda pulsación de un doble toque no parte la entrada en dos).
 */
@Injectable()
export class TaskTimeService {
    constructor(
        @InjectRepository(TaskTimeEntry) private readonly entries: Repository<TaskTimeEntry>,
        private readonly tasks: TasksService,
    ) {}

    /** El cronómetro en marcha de la persona en esa iglesia, con su tarea, o `null`. */
    async running(churchId: string, ownerId: string): Promise<RunningTimer | null> {
        const entry = await this.entries.findOne({
            where: { churchId, ownerId, endedAt: IsNull() },
            order: { startedAt: 'DESC' },
        });
        if (!entry) return null;
        const task = await this.tasks.findAny(churchId, ownerId, entry.taskId);
        return { entry: view(entry), task: { id: entry.taskId, title: task?.title ?? '' } };
    }

    async start(
        churchId: string,
        ownerId: string,
        taskId: string,
        now = new Date(),
    ): Promise<RunningTimer> {
        const task = await this.tasks.require(churchId, ownerId, taskId);
        const open = await this.entries.find({ where: { churchId, ownerId, endedAt: IsNull() } });
        const same = open.find((entry) => entry.taskId === taskId);
        for (const entry of open) if (entry !== same) await this.close(entry, now);
        const entry =
            same ??
            (await this.entries.save(
                this.entries.create({ churchId, ownerId, taskId, startedAt: now, endedAt: null }),
            ));
        return { entry: view(entry), task: { id: task.id, title: task.title } };
    }

    async stop(churchId: string, ownerId: string, now = new Date()): Promise<TaskTimeEntryView> {
        const open = await this.entries.findOne({
            where: { churchId, ownerId, endedAt: IsNull() },
            order: { startedAt: 'DESC' },
        });
        if (!open) throw new NotFoundException('No hay ningún cronómetro en marcha');
        return view(await this.close(open, now));
    }

    /** Las entradas de una tarea, las más recientes primero, y el total de las cerradas. */
    async ofTask(churchId: string, ownerId: string, taskId: string): Promise<TaskTime> {
        await this.tasks.requireAny(churchId, ownerId, taskId);
        const rows = await this.entries.find({
            where: { churchId, ownerId, taskId },
            order: { startedAt: 'DESC' },
            take: MAX_ENTRIES,
        });
        const entries = rows.map(view);
        return { entries, totalSeconds: closedSeconds(entries) };
    }

    async remove(churchId: string, ownerId: string, id: string): Promise<void> {
        const entry = await this.entries.findOne({ where: { id, churchId, ownerId } });
        if (!entry) throw new NotFoundException('Esa entrada de tiempo no existe');
        await this.entries.softRemove(entry);
    }

    private close(entry: TaskTimeEntry, now: Date): Promise<TaskTimeEntry> {
        // Un reloj que retrocede no puede dejar una entrada que termina antes de empezar.
        entry.endedAt = now.getTime() < entry.startedAt.getTime() ? entry.startedAt : now;
        return this.entries.save(entry);
    }
}

function view(entry: TaskTimeEntry): TaskTimeEntryView {
    return {
        id: entry.id,
        taskId: entry.taskId,
        startedAt: entry.startedAt.toISOString(),
        endedAt: entry.endedAt?.toISOString() ?? null,
    };
}
