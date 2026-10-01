import { getDb, newId, nowIso } from '../db';
import { assertInChurch } from '../church-scope';
import { storeAudio, removeAudioAt } from '../audio-storage';
export async function addAudio(
    noteId: string,
    audio: {
        sourceUri: string;
        mimeType: string;
        sizeBytes: number;
        durationSeconds: number | null;
        recorded: boolean;
    },
    churchId: string,
): Promise<void> {
    const db = await getDb();
    await assertInChurch(db, 'believer_notes', noteId, churchId);
    const id = newId();
    const fileUri = await storeAudio(id, audio.sourceUri);
    await db.runAsync(
        'INSERT INTO note_audios (id, created_at, updated_at, deleted_at, church_id, note_id, mime_type, size_bytes, duration_seconds, recorded, storage_key) VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?)',
        id,
        nowIso(),
        nowIso(),
        churchId,
        noteId,
        audio.mimeType,
        audio.sizeBytes,
        audio.durationSeconds,
        audio.recorded ? 1 : 0,
        fileUri,
    );
}

export async function deleteAudio(audioId: string, churchId: string): Promise<void> {
    const db = await getDb();
    const row = await db.getFirstAsync<{ storage_key: string }>(
        'SELECT storage_key FROM note_audios WHERE id = ? AND note_audios.church_id = ? ',
        audioId,
        churchId,
    );
    if (row) {
        try {
            removeAudioAt(row.storage_key);
        } catch {
            // Un fichero que ya no está no impide borrar su fila.
        }
    }
    await db.runAsync(
        'DELETE FROM note_audios WHERE id = ? AND note_audios.church_id = ? ',
        audioId,
        churchId,
    );
}
