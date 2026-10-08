import '@/data/test-support';
import { buildBackup } from './create-backup';
import { restoreBackup } from './restore-backup';
import type { BackupFiles } from './backup-format';
import { createJournalEntry, findJournalEntry, listJournal } from '@/data/repos/journal-repo';
import { addJournalAudio } from '@/data/repos/journal-audios';
import { tasksFixture } from '@/data/repos/tasks-test-support';
jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn() }));
jest.mock('@/data/audio-storage', () => ({
    storeAudio: (id: string) => Promise.resolve(`old://${id}`),
    removeAudioAt: jest.fn(),
}));
describe('backup de cuaderno con audio binario', () => {
    const { contexts: c, clear } = tasksFixture();
    it('restaura cuerpo, recordatorio y binario con URI del nuevo teléfono', async () => {
        const written = new Map<string, string>();
        const files: BackupFiles = {
            audioUri: (id) => `new://${id}`,
            photoUri: (id) => id,
            readAudio: () => Promise.resolve('AQIDBA=='),
            readPhoto: () => Promise.resolve(null),
            writeAudio: (id, content) => {
                written.set(id, content);
                return Promise.resolve();
            },
            writePhoto: async () => {},
        };
        const id = await createJournalEntry(c.north, {
            title: 'Con audio',
            kind: 'testimonio',
            occurredAt: '2026-10-08',
            annotation: 'Texto íntegro '.repeat(50),
            learned: 'Escuchar',
            remindAt: '2099-10-08T19:00:00Z',
            remindText: 'Volver',
        });
        await addJournalAudio(c.north, id, {
            sourceUri: 'source://recording',
            mimeType: 'audio/mp4',
            sizeBytes: 4,
            durationSeconds: 12,
            recorded: true,
        });
        const before = await findJournalEntry(c.north, id);
        if (!before) throw new Error('missing-entry');
        const backup = await buildBackup(files);
        expect(backup.tables.journal_entries).toHaveLength(1);
        expect(backup.audios[before.audios[0].id]).toBe('AQIDBA==');
        await clear();
        await restoreBackup(JSON.stringify(backup), files);
        const restored = await findJournalEntry(c.north, id);
        expect(restored).toEqual({
            ...before,
            audios: [{ ...before.audios[0], uri: `new://${before.audios[0].id}` }],
        });
        expect(written.get(before.audios[0].id)).toBe('AQIDBA==');
        expect((await listJournal(c.south, {})).total).toBe(0);
    });
});
