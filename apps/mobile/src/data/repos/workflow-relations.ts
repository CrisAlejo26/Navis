import type { WorkflowRef } from '@navis/shared';
import type { LocalDb } from '../db';
import type { TasksContext } from './tasks-context';

/** Que el flujo sea de la cuenta en esta iglesia, o `not-found`. `null` (sin flujo) siempre vale. */
export async function requireOwnWorkflow(
    db: LocalDb,
    context: TasksContext,
    id: string | null | undefined,
): Promise<void> {
    if (!id) return;
    const row = await db.getFirstAsync(
        'SELECT id FROM workflows WHERE id = ? AND church_id = ? AND owner_id = ? AND deleted_at IS NULL',
        id,
        context.churchId,
        context.userId,
    );
    if (!row) throw new Error('not-found');
}

/** Lo justo para pintar el flujo de una tarea; un flujo borrado ya no aparece. */
export async function readWorkflowRef(
    db: LocalDb,
    context: TasksContext,
    id: string | null,
): Promise<WorkflowRef | null> {
    if (!id) return null;
    return db.getFirstAsync<WorkflowRef>(
        'SELECT id, name, accent FROM workflows WHERE id = ? AND church_id = ? AND owner_id = ? AND deleted_at IS NULL',
        id,
        context.churchId,
        context.userId,
    );
}
