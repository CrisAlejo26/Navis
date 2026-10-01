import { getDb, newId, nowIso } from '../db';
import { assertInChurch } from '../church-scope';
import { recomputeLastNote } from './note-last-date';
import type { WriteNoteInput } from './note-input';
export async function createNote(
    believerId: string,
    churchId: string,
    authorId: string | null,
    input: WriteNoteInput,
): Promise<string> {
    const db = await getDb();
    const id = newId();
    await db.withTransactionAsync(async () => {
        await assertInChurch(db, 'believers', believerId, churchId);
        if (input.giftId) await assertInChurch(db, 'gifts', input.giftId, churchId);
        await db.runAsync(
            `INSERT INTO believer_notes (id, created_at, updated_at, deleted_at, church_id, believer_id, kind, occurred_at,
       told, advice, gift_id, remind_at, remind_text, author_id)
     VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            id,
            nowIso(),
            nowIso(),
            churchId,
            believerId,
            input.kind,
            input.occurredAt,
            input.told,
            input.advice ?? null,
            input.giftId ?? null,
            input.remindAt ?? null,
            input.remindText ?? null,
            authorId,
        );
        // D8: anotar que alguien recibió un don y que su ficha lo enseñe son la
        // misma acción. Si ya lo tenía, la fila se queda como estaba.
        if (input.kind === 'don' && input.giftId) {
            const existing = await db.getFirstAsync<{ id: string }>(
                'SELECT id FROM believer_gifts WHERE believer_id = ? AND gift_id = ? AND deleted_at IS NULL AND believer_gifts.believer_id IN (SELECT id FROM believers WHERE church_id = ? AND deleted_at IS NULL) ',
                believerId,
                input.giftId,
                churchId,
            );
            if (!existing) {
                await db.runAsync(
                    'INSERT INTO believer_gifts (id, created_at, updated_at, deleted_at, believer_id, gift_id, received_at) SELECT ?, ?, ?, NULL, ?, ?, ? WHERE EXISTS (SELECT id FROM believers WHERE id = ? AND church_id = ? AND deleted_at IS NULL)',
                    newId(),
                    nowIso(),
                    nowIso(),
                    believerId,
                    input.giftId,
                    input.occurredAt,
                    believerId,
                    churchId,
                );
            }
        }
        await recomputeLastNote(db, believerId, churchId);
    });
    return id;
}
