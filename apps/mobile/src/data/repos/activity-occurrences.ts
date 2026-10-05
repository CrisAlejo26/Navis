import type { TaskStatus } from '@navis/shared';
import type { LocalDb } from '../db';
import type { ActivityKind, TasksContext } from './tasks-context';

export interface MaterializedActivity {
    parentId: string;
    date: string;
    status: TaskStatus;
    completedAt: string | null;
}
export async function activityOccurrences(
    db: LocalDb,
    context: TasksContext,
    kind: ActivityKind,
    from: string,
    to: string,
): Promise<Map<string, MaterializedActivity>> {
    const rows = await db.getAllAsync<MaterializedActivity>(
        `SELECT o.${kind}_id AS parentId, o.date, o.status, o.completed_at AS completedAt
         FROM ${kind}_occurrences o JOIN ${kind}s p ON p.id = o.${kind}_id
         WHERE p.church_id = ? AND p.owner_id = ? AND o.deleted_at IS NULL AND o.date BETWEEN ? AND ?`,
        context.churchId,
        context.userId,
        from,
        to,
    );
    return new Map(rows.map((row) => [`${row.parentId}:${row.date}`, row]));
}
