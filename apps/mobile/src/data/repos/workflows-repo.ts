import {
    createWorkflowSchema,
    updateWorkflowSchema,
    type CreateWorkflowInput,
    type UpdateWorkflowInput,
    type WorkflowWithCount,
} from '@navis/shared';
import { newId, nowIso } from '../db';
import { inLocalTransaction } from '../local-transaction';
import { tasksDb, type TasksContext } from './tasks-context';
import { requireOwnWorkflow } from './workflow-relations';

/** Los flujos de la cuenta en esta iglesia, con cuántas tareas lleva cada uno. */
export async function listWorkflows(context: TasksContext): Promise<WorkflowWithCount[]> {
    return (await tasksDb(context)).getAllAsync<WorkflowWithCount>(
        `SELECT w.id, w.name, w.description, w.accent, w.position,
                (SELECT COUNT(*) FROM tasks t WHERE t.workflow_id = w.id AND t.church_id = w.church_id
                 AND t.owner_id = w.owner_id AND t.deleted_at IS NULL) AS count
         FROM workflows w WHERE w.church_id = ? AND w.owner_id = ? AND w.deleted_at IS NULL
         ORDER BY w.position, w.created_at, w.id`,
        context.churchId,
        context.userId,
    );
}

export async function createWorkflow(
    context: TasksContext,
    input: CreateWorkflowInput,
): Promise<string> {
    const data = createWorkflowSchema.parse(input),
        db = await tasksDb(context),
        id = newId();
    await inLocalTransaction(db, async (tx) => {
        const next = await tx.getFirstAsync<{ position: number }>(
            'SELECT COALESCE(MAX(position), -1) + 1 AS position FROM workflows WHERE church_id = ? AND owner_id = ?',
            context.churchId,
            context.userId,
        );
        await tx.runAsync(
            `INSERT INTO workflows (id, created_at, updated_at, deleted_at, church_id, owner_id, name, description, accent, position)
             VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?)`,
            id,
            nowIso(),
            nowIso(),
            context.churchId,
            context.userId,
            data.name,
            data.description ?? null,
            data.accent,
            next?.position ?? 0,
        );
    });
    return id;
}

export async function updateWorkflow(
    context: TasksContext,
    id: string,
    input: UpdateWorkflowInput,
): Promise<void> {
    const patch = updateWorkflowSchema.parse(input),
        db = await tasksDb(context);
    await inLocalTransaction(db, async (tx) => {
        await requireOwnWorkflow(tx, context, id);
        const previous = await tx.getFirstAsync<{
            name: string;
            description: string | null;
            accent: string;
        }>(
            'SELECT name, description, accent FROM workflows WHERE id = ? AND church_id = ? AND owner_id = ?',
            id,
            context.churchId,
            context.userId,
        );
        if (!previous) throw new Error('not-found');
        const data = { ...previous, ...patch };
        await tx.runAsync(
            'UPDATE workflows SET name = ?, description = ?, accent = ?, updated_at = ? WHERE id = ? AND church_id = ? AND owner_id = ?',
            data.name,
            data.description ?? null,
            data.accent,
            nowIso(),
            id,
            context.churchId,
            context.userId,
        );
    });
}

/** Borrar un flujo deja a sus tareas sin flujo: nunca las borra. */
export async function deleteWorkflow(context: TasksContext, id: string): Promise<void> {
    const db = await tasksDb(context);
    await inLocalTransaction(db, async (tx) => {
        await requireOwnWorkflow(tx, context, id);
        await tx.runAsync(
            'UPDATE tasks SET workflow_id = NULL, updated_at = ? WHERE workflow_id = ? AND church_id = ? AND owner_id = ?',
            nowIso(),
            id,
            context.churchId,
            context.userId,
        );
        await tx.runAsync(
            'UPDATE workflows SET deleted_at = ?, updated_at = ? WHERE id = ? AND church_id = ? AND owner_id = ?',
            nowIso(),
            nowIso(),
            id,
            context.churchId,
            context.userId,
        );
    });
}
