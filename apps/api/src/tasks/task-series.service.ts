import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { changeTaskSeries, type Paginated, type Task as TaskView, type TaskSeriesActionInput } from '@navis/shared';
import { Repository } from 'typeorm';
import { Task } from './task.entity';
import { TasksService } from './tasks.service';

@Injectable()
export class TaskSeriesService {
    constructor(@InjectRepository(Task) private readonly tasks: Repository<Task>, private readonly templates: TasksService) {}

    async list(churchId: string, ownerId: string, recurring: boolean, page = 1, limit = 100): Promise<Paginated<TaskView>> {
        page = Math.max(1, page); limit = Math.min(100, Math.max(1, limit));
        const where = recurring ? { churchId, ownerId, isRecurring: true } : { churchId, ownerId };
        const [rows, total] = await this.tasks.findAndCount({ where, order: { manualOrder: 'ASC', date: 'ASC', id: 'ASC' }, skip: (page - 1) * limit, take: limit });
        return { items: await Promise.all(rows.map((row) => this.templates.view(churchId, ownerId, row.id))), page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
    }

    async action(churchId: string, ownerId: string, id: string, command: TaskSeriesActionInput): Promise<void> {
        await this.tasks.manager.transaction(async (manager) => {
            const repo = manager.getRepository(Task);
            const task = await repo.findOneBy({ id, churchId, ownerId });
            if (!task || !task.isRecurring) throw new UnprocessableEntityException('series-not-found');
            if (command.date < task.date) throw new UnprocessableEntityException('series-date');
            try { Object.assign(task, changeTaskSeries(task, command)); }
            catch { throw new UnprocessableEntityException('series-state'); }
            await repo.save(task);
        });
    }

    async order(churchId: string, ownerId: string, ids: string[]): Promise<void> {
        await this.tasks.manager.transaction(async (manager) => {
            const repo = manager.getRepository(Task);
            const rows = await repo.find({ where: { churchId, ownerId } });
            const available = new Set(rows.map((row) => row.id));
            if (ids.some((id) => !available.has(id))) throw new UnprocessableEntityException('task-not-found');
            const rest = rows.filter((row) => !ids.includes(row.id)).sort((a, b) => (a.manualOrder ?? Infinity) - (b.manualOrder ?? Infinity) || a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
            for (const [manualOrder, id] of [...ids, ...rest.map((row) => row.id)].entries()) await repo.update({ id, churchId, ownerId }, { manualOrder });
        });
    }
}
