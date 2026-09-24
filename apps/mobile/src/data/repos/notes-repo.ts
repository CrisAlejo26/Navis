import {
    type BelieverNote,
    type NoteCounts,
    type NoteDay,
    type NoteKind,
    type Paginated,
    NOTE_KINDS,
} from '@navis/shared';

import type { SQLiteBindValue } from 'expo-sqlite';

import { getDb, newId, nowIso } from '../db';
import { audioUri, removeAudioAt, storeAudio } from '../audio-storage';

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

async function audiosOf(noteId: string): Promise<LocalNoteAudio[]> {
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
        'SELECT id, mime_type, size_bytes, duration_seconds, recorded, storage_key, created_at FROM note_audios WHERE note_id = ? ORDER BY created_at ASC',
        noteId,
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
        audios: await audiosOf(row.id),
        authorId: row.author_id,
        authorName: row.author_name,
        createdAt: row.created_at,
    };
}

const NOTE_FROM = `FROM believer_notes n
  LEFT JOIN gifts g ON g.id = n.gift_id
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

/** Las pastillas de tipo con su cuenta (§7.5). */
export async function noteCounts(believerId: string): Promise<NoteCounts> {
    const db = await getDb();
    const rows = await db.getAllAsync<{ kind: string; total: number }>(
        'SELECT kind, COUNT(*) AS total FROM believer_notes WHERE believer_id = ? AND deleted_at IS NULL GROUP BY kind',
        believerId,
    );
    const byKind = new Map(rows.map((row) => [row.kind as NoteKind, row.total]));
    const counts = Object.fromEntries(
        NOTE_KINDS.map((kind) => [kind, byKind.get(kind) ?? 0]),
    ) as NoteCounts;
    counts.total = rows.reduce((sum, row) => sum + row.total, 0);
    return counts;
}

/** Un día con notas, para la vista de calendario (§7.5). */
export async function noteDays(believerId: string, from: string, to: string): Promise<NoteDay[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<{ occurred_at: string; kind: string }>(
        'SELECT occurred_at, kind FROM believer_notes WHERE believer_id = ? AND deleted_at IS NULL AND occurred_at >= ? AND occurred_at <= ? ORDER BY occurred_at ASC',
        believerId,
        from,
        to,
    );

    const byDay = new Map<string, NoteDay>();
    for (const row of rows) {
        const day = byDay.get(row.occurred_at) ?? { date: row.occurred_at, kinds: [], total: 0 };
        if (!day.kinds.includes(row.kind as NoteKind)) day.kinds.push(row.kind as NoteKind);
        day.total += 1;
        byDay.set(row.occurred_at, day);
    }
    return [...byDay.values()].sort((one, other) => one.date.localeCompare(other.date));
}

/** D4: la columna derivada se recalcula en un solo sitio y nunca a mano. */
async function recomputeLastNote(
    db: Awaited<ReturnType<typeof getDb>>,
    believerId: string,
): Promise<void> {
    await db.runAsync(
        `UPDATE believers SET last_note_at = (
       SELECT MAX(occurred_at) FROM believer_notes WHERE believer_id = ? AND deleted_at IS NULL
     ), updated_at = ? WHERE id = ?`,
        believerId,
        nowIso(),
        believerId,
    );
}

export interface WriteNoteInput {
    kind: NoteKind;
    occurredAt: string;
    told: string;
    advice?: string | null;
    giftId?: string | null;
    remindAt?: string | null;
    remindText?: string | null;
}

export async function createNote(
    believerId: string,
    churchId: string,
    authorId: string | null,
    input: WriteNoteInput,
): Promise<string> {
    const db = await getDb();
    const id = newId();
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
            'SELECT id FROM believer_gifts WHERE believer_id = ? AND gift_id = ? AND deleted_at IS NULL',
            believerId,
            input.giftId,
        );
        if (!existing) {
            await db.runAsync(
                'INSERT INTO believer_gifts (id, created_at, updated_at, deleted_at, believer_id, gift_id, received_at) VALUES (?, ?, ?, NULL, ?, ?, ?)',
                newId(),
                nowIso(),
                nowIso(),
                believerId,
                input.giftId,
                input.occurredAt,
            );
        }
    }
    await recomputeLastNote(db, believerId);
    return id;
}

export async function updateNote(
    noteId: string,
    believerId: string,
    input: Partial<WriteNoteInput> & { remindDone?: boolean },
): Promise<void> {
    const db = await getDb();
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
    if (input.remindDone !== undefined) set('remind_done_at', input.remindDone ? nowIso() : null);

    if (fields.length > 0) {
        await db.runAsync(
            `UPDATE believer_notes SET ${fields.join(', ')}, updated_at = ? WHERE id = ? AND deleted_at IS NULL`,
            ...params,
            nowIso(),
            noteId,
        );
    }
    await recomputeLastNote(db, believerId);
}

export async function deleteNote(noteId: string, believerId: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(
        'UPDATE believer_notes SET deleted_at = ?, updated_at = ? WHERE id = ?',
        nowIso(),
        nowIso(),
        noteId,
    );
    await recomputeLastNote(db, believerId);
}

/** Un audio, ya en su sitio: se copia a Documentos y se apunta en la nota. */
export async function addAudio(
    noteId: string,
    audio: {
        sourceUri: string;
        mimeType: string;
        sizeBytes: number;
        durationSeconds: number | null;
        recorded: boolean;
    },
): Promise<void> {
    const db = await getDb();
    const id = newId();
    const fileUri = await storeAudio(id, audio.sourceUri);
    // El `church_id` viaja con la nota (paridad con la API); se lee de ella.
    const nota = await db.getFirstAsync<{ church_id: string }>(
        'SELECT church_id FROM believer_notes WHERE id = ?',
        noteId,
    );
    await db.runAsync(
        'INSERT INTO note_audios (id, created_at, updated_at, deleted_at, church_id, note_id, mime_type, size_bytes, duration_seconds, recorded, storage_key) VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?)',
        id,
        nowIso(),
        nowIso(),
        nota?.church_id ?? '',
        noteId,
        audio.mimeType,
        audio.sizeBytes,
        audio.durationSeconds,
        audio.recorded ? 1 : 0,
        fileUri,
    );
}

export async function deleteAudio(audioId: string): Promise<void> {
    const db = await getDb();
    const row = await db.getFirstAsync<{ storage_key: string }>(
        'SELECT storage_key FROM note_audios WHERE id = ?',
        audioId,
    );
    if (row) {
        try {
            removeAudioAt(row.storage_key);
        } catch {
            // Un fichero que ya no está no impide borrar su fila.
        }
    }
    await db.runAsync('DELETE FROM note_audios WHERE id = ?', audioId);
}
