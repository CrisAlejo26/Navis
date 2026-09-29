import type { DreamAudio } from '@navis/shared';

import { audioUri, removeAudioAt, storeAudio } from '../audio-storage';
import { getDb, newId, nowIso } from '../db';

/**
 * Los audios de un sueño **en local**: espejo de `note_audios` (RFC 0005 D13).
 * El fichero vive en Documentos (`audio-storage.ts`) y `storage_key` guarda su
 * URI; la fila es solo la ficha. El dueño se alcanza por el sueño (D1).
 */

/** Un audio local: el del contrato más su URI en disco, que es lo que oye el reproductor. */
export type LocalDreamAudio = DreamAudio & { uri: string };

interface AudioRow {
    id: string;
    dream_id: string;
    mime_type: string;
    size_bytes: number;
    duration_seconds: number | null;
    recorded: number;
    storage_key: string;
    created_at: string;
}

export async function audiosOfDream(dreamId: string): Promise<LocalDreamAudio[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<AudioRow>(
        'SELECT id, dream_id, mime_type, size_bytes, duration_seconds, recorded, storage_key, created_at FROM dream_audios WHERE dream_id = ? AND deleted_at IS NULL ORDER BY created_at ASC',
        dreamId,
    );
    return rows.map((row) => ({
        id: row.id,
        dreamId: row.dream_id,
        mimeType: row.mime_type,
        sizeBytes: row.size_bytes,
        durationSeconds: row.duration_seconds,
        recorded: row.recorded === 1,
        createdAt: row.created_at,
        uri: row.storage_key || audioUri(row.id),
    }));
}

export interface WriteDreamAudioInput {
    sourceUri: string;
    mimeType: string;
    sizeBytes: number;
    durationSeconds: number | null;
    recorded: boolean;
}

/** Un audio, ya en su sitio: se copia a Documentos y se apunta en el sueño. */
export async function addDreamAudio(
    ownerId: string,
    dreamId: string,
    audio: WriteDreamAudioInput,
): Promise<void> {
    const db = await getDb();
    const dream = await db.getFirstAsync<{ id: string }>(
        'SELECT id FROM dreams WHERE id = ? AND owner_id = ? AND deleted_at IS NULL',
        dreamId,
        ownerId,
    );
    if (!dream) return;

    const id = newId();
    const fileUri = await storeAudio(id, audio.sourceUri);
    const now = nowIso();
    await db.runAsync(
        'INSERT INTO dream_audios (id, created_at, updated_at, deleted_at, dream_id, storage_key, mime_type, size_bytes, duration_seconds, recorded) VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?)',
        id,
        now,
        now,
        dreamId,
        fileUri,
        audio.mimeType,
        audio.sizeBytes,
        audio.durationSeconds,
        audio.recorded ? 1 : 0,
    );
}

/** Quita los ficheros y las filas de los audios de una lista de sueños. */
export async function removeAudiosOf(dreamIds: readonly string[]): Promise<void> {
    const db = await getDb();
    for (const dreamId of dreamIds) {
        const rows = await db.getAllAsync<{ storage_key: string }>(
            'SELECT storage_key FROM dream_audios WHERE dream_id = ?',
            dreamId,
        );
        for (const row of rows) {
            try {
                removeAudioAt(row.storage_key);
            } catch {
                // Un fichero que ya no está no impide borrar su fila.
            }
        }
        await db.runAsync('DELETE FROM dream_audios WHERE dream_id = ?', dreamId);
    }
}

export async function deleteDreamAudio(ownerId: string, audioId: string): Promise<void> {
    const db = await getDb();
    const row = await db.getFirstAsync<{ storage_key: string }>(
        'SELECT a.storage_key FROM dream_audios a JOIN dreams d ON d.id = a.dream_id WHERE a.id = ? AND d.owner_id = ?',
        audioId,
        ownerId,
    );
    if (!row) return;
    try {
        removeAudioAt(row.storage_key);
    } catch {
        // Un fichero que ya no está no impide borrar su fila.
    }
    await db.runAsync('DELETE FROM dream_audios WHERE id = ?', audioId);
}
