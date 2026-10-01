import { type BelieverNote, type NoteKind, type Paginated } from '@navis/shared';

import type { SQLiteBindValue } from 'expo-sqlite';

import { getDb } from '../db';
import { audioUri } from '../audio-storage';
export { noteDays } from './note-counts';
export { noteCounts } from './note-counts';
export { deleteAudio } from './note-audio-writes';
export { addAudio } from './note-audio-writes';
export { deleteNote } from './note-writes';
export { updateNote } from './note-writes';
export { createNote } from './note-create';
export type { WriteNoteInput } from './note-input';

/**
 * La bitácora **en local** (RFC 0003 §5.3): el mismo contrato que
 * `NotesService` de la API. `last_note_at` se recalcula aquí —al crear, al
 * cambiar la fecha y al borrar— y nunca se escribe a mano desde otro sitio (D4).
 */

const PAGE_DEFAULT = 20;

const NOTE_COLUMNS = `n.id, n.church_id, n.believer_id, n.kind, n.occurred_at, n.told, n.advice,
  n.gift_id, n.remind_at, n.remind_text, n.remind_done_at, n.author_id, n.created_at`;

interface NoteRow {
    id: string;
    church_id: string;
    believer_id: string;
    kind: string;
    occurred_at: string;
    told: string;
    advice: string | null;
    gift_id: string | null;
    remind_at: string | null;
    remind_text: string | null;
    remind_done_at: string | null;
    author_id: string | null;
    created_at: string;
    gift_name: string | null;
    author_name: string | null;
}

interface NotesQuery {
    page?: number;
    limit?: number;
    search?: string;
    kind?: NoteKind;
}

/** Un audio local: el del contrato más su URI en disco, que es lo que oye el reproductor. */
export type LocalNoteAudio = BelieverNote['audios'][number] & { uri: string };

/** La nota que devuelve este repo: igual que la del contrato, con audios localizables. */
export type LocalNote = Omit<BelieverNote, 'audios'> & { audios: LocalNoteAudio[] };

async function audiosOf(noteId: string, churchId: string): Promise<LocalNoteAudio[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<{
        id: string;
        mime_type: string;
        size_bytes: number;
        duration_seconds: number | null;
        recorded: number;
        storage_key: string;
        created_at: string;
    }>(
        'SELECT id, mime_type, size_bytes, duration_seconds, recorded, storage_key, created_at FROM note_audios WHERE note_id = ? AND note_audios.church_id = ? ORDER BY created_at ASC',
        noteId,
        churchId,
    );
    return rows.map((row) => ({
        id: row.id,
        noteId,
        mimeType: row.mime_type,
        sizeBytes: row.size_bytes,
        durationSeconds: row.duration_seconds,
        recorded: row.recorded === 1,
        createdAt: row.created_at,
        uri: row.storage_key || audioUri(row.id),
    }));
}

async function toNote(row: NoteRow): Promise<LocalNote> {
    return {
        id: row.id,
        churchId: row.church_id,
        believerId: row.believer_id,
        kind: row.kind as BelieverNote['kind'],
        occurredAt: row.occurred_at,
        told: row.told,
        advice: row.advice,
        giftId: row.gift_id,
        giftName: row.gift_name,
        remindAt: row.remind_at,
        remindText: row.remind_text,
        remindDoneAt: row.remind_done_at,
        audios: await audiosOf(row.id, row.church_id),
        authorId: row.author_id,
        authorName: row.author_name,
        createdAt: row.created_at,
    };
}

const NOTE_FROM = `FROM believer_notes n
  LEFT JOIN gifts g ON g.id = n.gift_id AND g.church_id = n.church_id
  LEFT JOIN local_user u ON u.id = n.author_id`;

export async function listNotes(
    believerId: string,
    churchId: string,
    query: NotesQuery = {},
): Promise<Paginated<LocalNote>> {
    const db = await getDb();
    const page = query.page ?? 1;
    const limit = query.limit ?? PAGE_DEFAULT;

    const clauses = ['n.believer_id = ?', 'n.church_id = ?', 'n.deleted_at IS NULL'];
    const params: SQLiteBindValue[] = [believerId, churchId];
    if (query.kind) {
        clauses.push('n.kind = ?');
        params.push(query.kind);
    }
    if (query.search) {
        clauses.push('(n.told LIKE ? OR n.advice LIKE ?)');
        const like = `%${query.search}%`;
        params.push(like, like);
    }
    const where = clauses.join(' AND ');

    const total =
        (
            await db.getFirstAsync<{ total: number }>(
                `SELECT COUNT(*) AS total ${NOTE_FROM} WHERE ${where}`,
                ...params,
            )
        )?.total ?? 0;
    const rows = await db.getAllAsync<NoteRow>(
        `SELECT ${NOTE_COLUMNS}, g.name AS gift_name, u.name AS author_name ${NOTE_FROM} WHERE ${where}
     ORDER BY n.occurred_at DESC, n.created_at DESC LIMIT ? OFFSET ?`,
        ...params,
        limit,
        (page - 1) * limit,
    );

    return {
        items: await Promise.all(rows.map(toNote)),
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
    };
}

/** Una nota por su id: el aviso de un recordatorio la abre aunque no esté en la primera página. */
export async function findNote(noteId: string, churchId: string): Promise<LocalNote | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<NoteRow>(
        `SELECT ${NOTE_COLUMNS}, g.name AS gift_name, u.name AS author_name ${NOTE_FROM}
     WHERE n.id = ? AND n.church_id = ? AND n.deleted_at IS NULL`,
        noteId,
        churchId,
    );
    return row ? toNote(row) : null;
}
