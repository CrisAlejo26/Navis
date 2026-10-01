import { isolationSuite } from '@/data/test-support/church-isolation-suite';
import { ISOLATION_OWNER } from '@/data/test-support/seed-two-churches';
import { getDb } from '@/data/db';
import { resolveActiveChurch, setActiveChurch, listMyChurches } from '@/data/repos/church-access';
import { listBelievers } from '@/data/repos/believers-repo';
import { findNote } from '@/data/repos/notes-repo';
import { listCalendars } from '@/data/repos/calendar-repo';
import { listGifts } from '@/data/repos/catalog-repo';
import { buildBackup } from './create-backup';
import { restoreBackup } from './restore-backup';
import type { BackupFiles } from './backup-format';
const suite = isolationSuite();

// D6: vaciar y restaurar devuelve datos y pertenencias de N iglesias, no solo la activa.
it('restaura dos iglesias completas, audios y una selección válida', async () => {
    const { north, south } = suite.churches();
    const db = await getDb();
    await db.runAsync(
        "INSERT INTO local_user (id, name, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 't')",
        ISOLATION_OWNER,
        'Ana',
        'ana@navis.test',
        'hash',
        't',
    );
    await setActiveChurch(ISOLATION_OWNER, south.churchId);
    const audios = new Map([
        [north.audioId, 'Tk9SVEU='],
        [south.audioId, 'U1VS'],
    ]);
    const files: BackupFiles = {
        audioUri: (id) => `file:///restaurado/${id}`,
        photoUri: (id) => `file:///fotos/${id}`,
        readAudio: (id) => Promise.resolve(audios.get(id) ?? null),
        readPhoto: () => Promise.resolve(null),
        writeAudio: (id, data) => Promise.resolve(void audios.set(id, data)),
        writePhoto: () => Promise.resolve(),
    };
    const backup = await buildBackup(files);
    expect(backup.tables.church_members).toHaveLength(2);
    await suite.db().clear();
    audios.clear();
    expect(await listMyChurches(ISOLATION_OWNER)).toEqual([]);
    await restoreBackup(JSON.stringify(backup), files);
    expect(await listMyChurches(ISOLATION_OWNER)).toHaveLength(2);
    expect((await resolveActiveChurch(ISOLATION_OWNER))?.id).toBe(south.churchId);
    for (const [prefix, church] of [
        ['N', north],
        ['S', south],
    ] as const) {
        expect(
            (await listBelievers({ churchId: church.churchId })).items.map((b) => b.firstName),
        ).toEqual([`${prefix}-Luis`]);
        expect(
            (await listCalendars(church.churchId)).every((c) => c.name.startsWith(`${prefix}-`)),
        ).toBe(true);
        expect((await listGifts(church.churchId)).some((g) => g.name === `${prefix}-Don`)).toBe(
            true,
        );
        const note = await findNote(church.noteId, church.churchId);
        expect(note?.told).toBe(`${prefix}-Nota`);
        expect(note?.audios[0]?.uri).toBe(`file:///restaurado/${church.audioId}`);
        expect(audios.get(church.audioId)).toBe(backup.audios[church.audioId]);
    }
    expect(await findNote(north.noteId, south.churchId)).toBeNull();
    expect(await findNote(south.noteId, north.churchId)).toBeNull();
});
