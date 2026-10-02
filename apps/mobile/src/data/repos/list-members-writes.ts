import { addListMembersSchema, updateListMemberSchema } from '@navis/shared';
import { assertAllInChurch } from '../church-scope';
import { nowIso } from '../db';
import { listDb, type ListContext } from './lists-context';

export async function addListMembers(
    context: ListContext,
    id: string,
    ids: string[],
): Promise<void> {
    const { believerIds } = addListMembersSchema.parse({ believerIds: ids });
    const db = await listDb(context, true, id);
    await db.withTransactionAsync(async () => {
        await assertAllInChurch(db, 'believers', believerIds, context.churchId);
        const count = await db.getFirstAsync<{ total: number }>(
            'SELECT COUNT(*) AS total FROM list_members WHERE list_id = ?',
            id,
        );
        const existing = await db.getAllAsync<{ believer_id: string }>(
            'SELECT believer_id FROM list_members WHERE list_id = ?',
            id,
        );
        const newIds = [...new Set(believerIds)].filter(
            (one) => !existing.some((member) => member.believer_id === one),
        );
        if ((count?.total ?? 0) + newIds.length > 500) throw new Error('limit');
        const last = await db.getFirstAsync<{ position: number | null }>(
            'SELECT MAX(position) AS position FROM list_members WHERE list_id = ?',
            id,
        );
        for (const [index, believerId] of newIds.entries()) {
            await db.runAsync(
                'INSERT INTO list_members (list_id, believer_id, position, added_at, added_by) VALUES (?, ?, ?, ?, ?)',
                id,
                believerId,
                (last?.position ?? -1) + index + 1,
                nowIso(),
                context.userId,
            );
        }
        await db.runAsync('UPDATE lists SET updated_at = ? WHERE id = ?', nowIso(), id);
    });
}

export async function updateMemberNote(
    context: ListContext,
    id: string,
    believerId: string,
    note: string | null,
): Promise<void> {
    const values = updateListMemberSchema.parse({ note });
    const db = await listDb(context, true, id);
    await assertAllInChurch(db, 'believers', [believerId], context.churchId);
    await db.withTransactionAsync(async () => {
        const result = await db.runAsync(
            'UPDATE list_members SET note = ? WHERE list_id = ? AND believer_id = ?',
            values.note || null,
            id,
            believerId,
        );
        if (!result.changes) throw new Error('not-found');
        await db.runAsync('UPDATE lists SET updated_at = ? WHERE id = ?', nowIso(), id);
    });
}

export async function removeListMember(
    context: ListContext,
    id: string,
    believerId: string,
): Promise<void> {
    const db = await listDb(context, true, id);
    await assertAllInChurch(db, 'believers', [believerId], context.churchId);
    await db.withTransactionAsync(async () => {
        await db.runAsync(
            'DELETE FROM list_members WHERE list_id = ? AND believer_id = ?',
            id,
            believerId,
        );
        await db.runAsync('UPDATE lists SET updated_at = ? WHERE id = ?', nowIso(), id);
    });
}
export { reorderListMembers } from './list-member-order';
