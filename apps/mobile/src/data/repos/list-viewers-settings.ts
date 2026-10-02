import {
    listPasswordSchema,
    updateListViewerSchema,
    type UpdateListViewerInput,
} from '@navis/shared';
import { assertAllInChurch } from '../church-scope';
import { nowIso } from '../db';
import { listDb, type ListContext } from './lists-context';
import { hashViewerPassword } from '@/lib/lists/viewer-password';

export async function updateListViewer(
    context: ListContext,
    id: string,
    input: UpdateListViewerInput,
) {
    const value = updateListViewerSchema.parse(input);
    const db = await listDb(context, true);
    await db.withTransactionAsync(async () => {
        await assertAllInChurch(db, 'list_viewers', [id], context.churchId);
        const now = nowIso();
        if (value.label !== undefined)
            await db.runAsync('UPDATE list_viewers SET label = ? WHERE id = ?', value.label, id);
        if (value.isActive !== undefined)
            await db.runAsync(
                'UPDATE list_viewers SET is_active = ? WHERE id = ?',
                Number(value.isActive),
                id,
            );
        if (value.expiresAt !== undefined) {
            if (value.expiresAt && !Number.isFinite(Date.parse(value.expiresAt)))
                throw new Error('invalid-date');
            await db.runAsync(
                'UPDATE list_viewers SET expires_at = ? WHERE id = ?',
                value.expiresAt,
                id,
            );
        }
        await db.runAsync(
            'UPDATE list_viewers SET updated_at = ?, sessions_valid_from = ? WHERE id = ?',
            now,
            now,
            id,
        );
    });
}

export async function regenerateViewerPassword(context: ListContext, id: string, password: string) {
    listPasswordSchema.parse(password);
    const db = await listDb(context, true);
    await assertAllInChurch(db, 'list_viewers', [id], context.churchId);
    const hash = await hashViewerPassword(password);
    await db.withTransactionAsync(async () => {
        await assertAllInChurch(db, 'list_viewers', [id], context.churchId);
        const now = nowIso();
        await db.runAsync(
            'UPDATE list_viewers SET password_hash = ?, sessions_valid_from = ?, updated_at = ? WHERE id = ?',
            hash,
            now,
            now,
            id,
        );
    });
}
