import type { LocalDb } from './local-db';

export type ChurchTable =
    | 'believers'
    | 'believer_notes'
    | 'note_audios'
    | 'believer_tags'
    | 'gifts'
    | 'congregations'
    | 'calendars'
    | 'meeting_patterns'
    | 'meetings';

/** Los ids ajenos y los inexistentes tienen el mismo resultado. */
export async function assertInChurch(
    db: LocalDb,
    table: ChurchTable,
    id: string,
    churchId: string,
): Promise<void> {
    const row = await db.getFirstAsync<{ id: string }>(
        `SELECT id FROM ${table} WHERE id = ? AND church_id = ? AND deleted_at IS NULL`,
        id,
        churchId,
    );
    if (!row) throw new Error('not-found');
}

export async function assertAllInChurch(
    db: LocalDb,
    table: ChurchTable,
    ids: readonly string[],
    churchId: string,
): Promise<void> {
    for (const id of new Set(ids)) await assertInChurch(db, table, id, churchId);
}
