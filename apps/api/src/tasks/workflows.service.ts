import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type {
    CreateWorkflowInput,
    UpdateWorkflowInput,
    WorkflowRef,
    WorkflowWithCount,
} from '@navis/shared';
import { In, Repository } from 'typeorm';

import { isUniqueViolation } from '../database/unique-violation';
import { Task } from './task.entity';
import { Workflow } from './workflow.entity';

/**
 * Los flujos de trabajo de una cuenta, por iglesia (Fase 7b). Se crean, editan
 * y borran como las etiquetas; borrar uno **no** borra sus tareas: se quedan
 * sin flujo.
 */
@Injectable()
export class WorkflowsService {
    constructor(
        @InjectRepository(Workflow) private readonly workflows: Repository<Workflow>,
        @InjectRepository(Task) private readonly tasks: Repository<Task>,
    ) {}

    async list(churchId: string, ownerId: string): Promise<WorkflowWithCount[]> {
        const rows = await this.workflows.find({
            where: { churchId, ownerId },
            order: { position: 'ASC', createdAt: 'ASC' },
        });
        const counts = await this.counts(
            churchId,
            ownerId,
            rows.map((row) => row.id),
        );
        return rows.map((row) => ({ ...view(row), count: counts.get(row.id) ?? 0 }));
    }

    async require(churchId: string, ownerId: string, id: string): Promise<Workflow> {
        const workflow = await this.workflows.findOne({ where: { id, churchId, ownerId } });
        if (!workflow) throw new NotFoundException('Ese flujo no existe');
        return workflow;
    }

    /** Que el flujo sea de la cuenta, o 404. Un `null` (sin flujo) siempre vale. */
    async requireOrNone(
        churchId: string,
        ownerId: string,
        id: string | null | undefined,
    ): Promise<void> {
        if (id) await this.require(churchId, ownerId, id);
    }

    /** `id → ref` para pintar tarjetas. Un flujo borrado no aparece. */
    async refs(ids: readonly string[]): Promise<Map<string, WorkflowRef>> {
        const unique = [...new Set(ids)];
        if (unique.length === 0) return new Map();
        const rows = await this.workflows.find({ where: { id: In(unique) } });
        return new Map(
            rows.map((row) => [row.id, { id: row.id, name: row.name, accent: row.accent }]),
        );
    }

    async create(
        churchId: string,
        ownerId: string,
        input: CreateWorkflowInput,
    ): Promise<WorkflowWithCount> {
        const position = await this.workflows.count({ where: { churchId, ownerId } });
        try {
            const saved = await this.workflows.save(
                this.workflows.create({
                    churchId,
                    ownerId,
                    name: input.name,
                    description: input.description ?? null,
                    accent: input.accent,
                    position,
                }),
            );
            return { ...view(saved), count: 0 };
        } catch (error) {
            throw duplicate(error);
        }
    }

    async update(
        churchId: string,
        ownerId: string,
        id: string,
        input: UpdateWorkflowInput,
    ): Promise<WorkflowWithCount> {
        const workflow = await this.require(churchId, ownerId, id);
        if (input.name !== undefined) workflow.name = input.name;
        if (input.description !== undefined) workflow.description = input.description;
        if (input.accent !== undefined) workflow.accent = input.accent;
        try {
            const saved = await this.workflows.save(workflow);
            const counts = await this.counts(churchId, ownerId, [saved.id]);
            return { ...view(saved), count: counts.get(saved.id) ?? 0 };
        } catch (error) {
            throw duplicate(error);
        }
    }

    async remove(churchId: string, ownerId: string, id: string): Promise<void> {
        const workflow = await this.require(churchId, ownerId, id);
        await this.tasks.update({ churchId, ownerId, workflowId: id }, { workflowId: null });
        await this.workflows.softRemove(workflow);
    }

    private async counts(
        churchId: string,
        ownerId: string,
        ids: readonly string[],
    ): Promise<Map<string, number>> {
        if (ids.length === 0) return new Map();
        const rows = await this.tasks
            .createQueryBuilder('task')
            .select('task.workflowId', 'workflowId')
            .addSelect('COUNT(*)', 'count')
            .where('task.churchId = :churchId AND task.ownerId = :ownerId', { churchId, ownerId })
            .andWhere('task.workflowId IN (:...ids)', { ids })
            .groupBy('task.workflowId')
            .getRawMany<{ workflowId: string; count: string | number }>();
        return new Map(rows.map((row) => [row.workflowId, Number(row.count)]));
    }
}

function view(workflow: Workflow) {
    return {
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        accent: workflow.accent,
        position: workflow.position,
    };
}

function duplicate(error: unknown): unknown {
    return isUniqueViolation(error)
        ? new ConflictException('Ya existe un flujo con ese nombre')
        : error;
}
