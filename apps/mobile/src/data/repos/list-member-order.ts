import { reorderListSchema } from '@navis/shared';
import { nowIso } from '../db';
import { listDb, type ListContext } from './lists-context';

export async function reorderListMembers(
    context: ListContext,
    id: string,
    ids: string[],
): Promise<void> {
    const { believerIds } = reorderListSchema.parse({ believerIds: ids });
    const db = await listDb(context, true, id);
    await db.withTransactionAsync(async () => {
        const current = await db.getAllAsync<{ believer_id: string; position: number }>(
            `SELECT m.believer_id, m.position FROM list_members m JOIN believers b ON b.id = m.believer_id
             WHERE m.list_id = ? AND b.church_id = ? AND b.deleted_at IS NULL ORDER BY m.position, b.id`,
            id,
            context.churchId,
        );
        if (
            new Set(ids).size !== ids.length ||
            current.length !== ids.length ||
            ids.some((one) => !current.some((member) => member.believer_id === one))
        )
            throw new Error('invalid-order');
        for (const [index, believerId] of believerIds.entries()) {
            await db.runAsync(
                'UPDATE list_members SET position = ? WHERE list_id = ? AND believer_id = ?',
                current[index].position,
                id,
                believerId,
            );
        }
        await db.runAsync('UPDATE lists SET updated_at = ? WHERE id = ?', nowIso(), id);
    });
}
