import type { JournalEntryAudio } from '@navis/shared';
import type { LocalDb } from '../local-db';
import { newId, nowIso } from '../local-db';
import { storeAudio, removeAudioAt } from '../audio-storage';
import { journalDb, type JournalContext } from './journal-context';
import type { WriteDreamAudioInput } from './dream-audios-repo';

export async function journalAudios(
    db: LocalDb,
    churchId: string,
    entryId: string,
): Promise<(JournalEntryAudio & { uri: string })[]> {
    const rows = await db.getAllAsync<{
        id: string;
        entry_id: string;
        mime_type: string;
        size_bytes: number;
        duration_seconds: number | null;
        recorded: number;
        created_at: string;
        storage_key: string;
    }>(
        'SELECT * FROM journal_entry_audios WHERE church_id = ? AND entry_id = ? AND deleted_at IS NULL ORDER BY created_at',
        churchId,
        entryId,
    );
    return rows.map((row) => ({
        id: row.id,
        entryId: row.entry_id,
        mimeType: row.mime_type,
        sizeBytes: row.size_bytes,
        durationSeconds: row.duration_seconds,
        recorded: Boolean(row.recorded),
        createdAt: row.created_at,
        uri: row.storage_key,
    }));
}
export async function addJournalAudio(
    context: JournalContext,
    entryId: string,
    audio: WriteDreamAudioInput,
) {
    const db = await journalDb(context, true, entryId),
        id = newId(),
        now = nowIso();
    const uri = await storeAudio(id, audio.sourceUri);
    try {
        await db.runAsync(
            'INSERT INTO journal_entry_audios (id, created_at, updated_at, deleted_at, church_id, entry_id, storage_key, mime_type, size_bytes, duration_seconds, recorded) VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?)',
            id,
            now,
            now,
            context.churchId,
            entryId,
            uri,
            audio.mimeType,
            audio.sizeBytes,
            audio.durationSeconds,
            audio.recorded ? 1 : 0,
        );
    } catch (error) {
        removeAudioAt(uri);
        throw error;
    }
}
export async function deleteJournalAudio(context: JournalContext, entryId: string, id: string) {
    const db = await journalDb(context, true, entryId);
    const audio = await db.getFirstAsync<{ storage_key: string }>(
        'SELECT storage_key FROM journal_entry_audios WHERE id = ? AND entry_id = ? AND church_id = ? AND deleted_at IS NULL',
        id,
        entryId,
        context.churchId,
    );
    if (!audio) throw new Error('not-found');
    const now = nowIso();
    await db.runAsync(
        'UPDATE journal_entry_audios SET deleted_at = ?, updated_at = ? WHERE id = ? AND church_id = ?',
        now,
        now,
        id,
        context.churchId,
    );
    removeAudioAt(audio.storage_key);
}
