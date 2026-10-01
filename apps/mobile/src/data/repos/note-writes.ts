import { getDb, nowIso } from '../db';
import type { SQLiteBindValue } from 'expo-sqlite';
import { assertInChurch } from '../church-scope';
import { assertNoteBeliever } from './note-references';
import { recomputeLastNote } from './note-last-date';
import type { WriteNoteInput } from './note-input';
export async function updateNote(
    noteId: string,
    believerId: string,
    input: Partial<WriteNoteInput> & { remindDone?: boolean },
    churchId: string,
): Promise<void> {
    const db = await getDb();
    await db.withTransactionAsync(async () => {
        await assertNoteBeliever(db, noteId, believerId, churchId);
        if (input.giftId) await assertInChurch(db, 'gifts', input.giftId, churchId);
        const fields: string[] = [];
        const params: SQLiteBindValue[] = [];
        const set = (column: string, value: SQLiteBindValue) => {
            fields.push(`${column} = ?`);
            params.push(value);
        };
        if (input.kind !== undefined) set('kind', input.kind);
        if (input.occurredAt !== undefined) set('occurred_at', input.occurredAt);
        if (input.told !== undefined) set('told', input.told);
        if (input.advice !== undefined) set('advice', input.advice);
        if (input.giftId !== undefined) set('gift_id', input.giftId);
        if (input.remindAt !== undefined) set('remind_at', input.remindAt);
        if (input.remindText !== undefined) set('remind_text', input.remindText);
        if (input.remindDone !== undefined)
            set('remind_done_at', input.remindDone ? nowIso() : null);

        if (fields.length > 0) {
            await db.runAsync(
                `UPDATE believer_notes SET ${fields.join(', ')}, updated_at = ? WHERE id = ? AND deleted_at IS NULL AND believer_notes.church_id = ? `,
                ...params,
                nowIso(),
                noteId,
                churchId,
            );
        }
        await recomputeLastNote(db, believerId, churchId);
    });
}

export async function deleteNote(
    noteId: string,
    believerId: string,
    churchId: string,
): Promise<void> {
    const db = await getDb();
    await db.withTransactionAsync(async () => {
        await assertNoteBeliever(db, noteId, believerId, churchId);
        await db.runAsync(
            'UPDATE believer_notes SET deleted_at = ?, updated_at = ? WHERE id = ? AND believer_notes.church_id = ? ',
            nowIso(),
            nowIso(),
            noteId,
            churchId,
        );
        await recomputeLastNote(db, believerId, churchId);
    });
}
