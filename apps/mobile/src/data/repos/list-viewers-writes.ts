import {
    createListViewerSchema,
    setListGrantsSchema,
    type CreateListViewerInput,
} from '@navis/shared';
import { assertAllInChurch } from '../church-scope';
import { newId, nowIso } from '../db';
import { listDb, type ListContext } from './lists-context';
import { hashViewerPassword } from '@/lib/lists/viewer-password';
import { readListViewers } from './list-viewers-reads';

export async function createListViewer(context: ListContext, input: CreateListViewerInput) {
    const value = createListViewerSchema.parse(input);
    const db = await listDb(context, true);
    const hash = await hashViewerPassword(value.password);
    const id = newId();
    await db.withTransactionAsync(async () => {
        if (value.believerId)
            await assertAllInChurch(db, 'believers', [value.believerId], context.churchId);
        await assertAllInChurch(db, 'lists', value.listIds ?? [], context.churchId);
        if (
            await db.getFirstAsync(
                'SELECT id FROM list_viewers WHERE church_id = ? AND username = ? AND deleted_at IS NULL',
                context.churchId,
                value.username,
            )
        )
            throw new Error('username-taken');
        const now = nowIso();
        await db.runAsync(
            `INSERT INTO list_viewers (id, church_id, believer_id, username, password_hash, label, is_active, expires_at, sessions_valid_from, created_by, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)`,
            id,
            context.churchId,
            value.believerId ?? null,
            value.username,
            hash,
            value.label,
            value.expiresAt ?? null,
            now,
            context.userId,
            now,
            now,
        );
        for (const listId of new Set(value.listIds))
            await db.runAsync(
                'INSERT INTO list_grants (viewer_id, list_id, granted_at, granted_by) VALUES (?, ?, ?, ?)',
                id,
                listId,
                now,
                context.userId,
            );
    });
    return (await readListViewers(context)).find((one) => one.id === id)!;
}

export async function setViewerLists(context: ListContext, id: string, ids: string[]) {
    const value = setListGrantsSchema.parse({ ids });
    const db = await listDb(context, true);
    await db.withTransactionAsync(async () => {
        await assertAllInChurch(db, 'list_viewers', [id], context.churchId);
        await assertAllInChurch(db, 'lists', value.ids, context.churchId);
        await db.runAsync('DELETE FROM list_grants WHERE viewer_id = ?', id);
        const now = nowIso();
        for (const listId of new Set(value.ids))
            await db.runAsync(
                'INSERT INTO list_grants (viewer_id, list_id, granted_at, granted_by) VALUES (?, ?, ?, ?)',
                id,
                listId,
                now,
                context.userId,
            );
        await db.runAsync(
            'UPDATE list_viewers SET sessions_valid_from = ?, updated_at = ? WHERE id = ?',
            now,
            now,
            id,
        );
    });
}

export async function revokeListViewer(context: ListContext, id: string) {
    const db = await listDb(context, true);
    await db.withTransactionAsync(async () => {
        await assertAllInChurch(db, 'list_viewers', [id], context.churchId);
        const now = nowIso();
        await db.runAsync('DELETE FROM list_grants WHERE viewer_id = ?', id);
        await db.runAsync(
            'UPDATE list_viewers SET deleted_at = ?, updated_at = ?, sessions_valid_from = ?, is_active = 0 WHERE id = ?',
            now,
            now,
            now,
            id,
        );
    });
}
