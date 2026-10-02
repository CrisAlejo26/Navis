import { Directory, File, Paths } from 'expo-file-system';
import { nowIso } from '../db';
import { listCoverFileId } from '../list-cover-storage';
import { listDb, type ListContext } from './lists-context';

export async function listCover(context: ListContext, id: string): Promise<string | null> {
    const db = await listDb(context, false, id);
    const row = await db.getFirstAsync<{ cover_key: string | null }>(
        'SELECT cover_key FROM lists WHERE id = ? AND church_id = ?',
        id,
        context.churchId,
    );
    return row?.cover_key ?? null;
}
export async function saveListCover(
    context: ListContext,
    id: string,
    source: string | null,
): Promise<void> {
    const db = await listDb(context, true, id);
    const previous = await listCover(context, id);
    let next: File | null = null;
    let rollback: File | null = null;
    let attemptedCopy = false;
    try {
        if (source) {
            const directory = new Directory(Paths.document, 'photos');
            directory.create({ idempotent: true, intermediates: true });
            next = new File(directory, listCoverFileId(id));
            if (next.exists) {
                rollback = new File(directory, `${listCoverFileId(id)}-previous`);
                if (rollback.exists) rollback.delete();
                await next.copy(rollback);
            }
            attemptedCopy = true;
            await new File(source).copy(next);
        }
        await db.runAsync(
            'UPDATE lists SET cover_key = ?, updated_at = ? WHERE id = ? AND church_id = ?',
            next?.uri ?? null,
            nowIso(),
            id,
            context.churchId,
        );
    } catch (error) {
        if (attemptedCopy && next?.exists) next.delete();
        if (attemptedCopy && rollback?.exists && next) await rollback.move(next);
        throw error;
    } finally {
        if (rollback?.exists) rollback.delete();
    }
    if (previous && previous !== next?.uri) {
        const file = new File(previous);
        if (file.exists) file.delete();
    }
}
