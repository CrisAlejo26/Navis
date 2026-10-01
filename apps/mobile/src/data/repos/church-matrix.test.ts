import { isolationSuite } from '../test-support/church-isolation-suite';
import { seedChurch, ISOLATION_OWNER } from '../test-support/seed-two-churches';
import { getDb } from '../db';
import { createBeliever, listBelievers } from './believers-repo';
import { findNote, noteCounts, updateNote } from './notes-repo';
import { listCalendars, listCongregations } from './calendar-repo';
import { listGifts, listTags } from './catalog-repo';
import { resolveActiveChurch, setActiveChurch, listMyChurches } from './church-access';
import { localDashboardRepository } from './dashboard-repo';
import { buildBackup } from '@/lib/backup/create-backup';
import { restoreBackup } from '@/lib/backup/restore-backup';
import type { BackupFiles } from '@/lib/backup/backup-format';
const suite = isolationSuite();

// Cierre: recorre todos los contextos, copia/restauración y activa ausente con dos y tres iglesias.
// Protege el aislamiento y la selección persistida al restaurar dos o tres iglesias.
it.each([2, 3])(
    'recupera %i iglesias sin mezclar listas, catálogos, calendarios ni notas',
    async (count) => {
        const { north, south } = suite.churches();
        const churches = [north, south];
        if (count === 3) churches.push(await seedChurch('E'));
        const db = await getDb();
        await db.runAsync(
            "INSERT INTO local_user (id, name, email, password_hash, created_at, updated_at) VALUES (?, 'QA', 'qa@navis.test', 'hash', 't', 't')",
            ISOLATION_OWNER,
        );
        const prefixes = ['N', 'S', 'E'];
        for (const [index, church] of churches.entries()) {
            for (let extra = 0; extra < index; extra++)
                await createBeliever(church.churchId, {
                    firstName: `${prefixes[index]}-Persona ${extra}`,
                });
            await updateNote(
                church.noteId,
                church.believerId,
                { remindAt: '2099-01-01T12:00:00' },
                church.churchId,
            );
            await setActiveChurch(ISOLATION_OWNER, church.churchId);
            expect((await resolveActiveChurch(ISOLATION_OWNER))?.id).toBe(church.churchId);
            expect(
                (await localDashboardRepository.summary(church.churchId, ISOLATION_OWNER)).believers
                    .total,
            ).toBe(index + 1);
            expect(
                (await listBelievers({ churchId: church.churchId })).items.every((b) =>
                    b.firstName.startsWith(`${prefixes[index]}-`),
                ),
            ).toBe(true);
            expect(
                (await listCalendars(church.churchId)).every((c) =>
                    c.name.startsWith(`${prefixes[index]}-`),
                ),
            ).toBe(true);
            expect(
                (await listCongregations(church.churchId)).some(
                    (c) => c.name === `${prefixes[index]}-Sede`,
                ),
            ).toBe(true);
            expect(
                (await listGifts(church.churchId)).some((g) => g.name === `${prefixes[index]}-Don`),
            ).toBe(true);
            expect((await listTags(church.churchId)).map((t) => t.name)).toEqual([
                `${prefixes[index]}-Etiqueta`,
            ]);
            expect((await noteCounts(church.believerId, church.churchId)).total).toBe(1);
            for (const other of churches.filter((c) => c !== church))
                expect(await findNote(other.noteId, church.churchId)).toBeNull();
        }
        const files: BackupFiles = {
            audioUri: (id) => `file:///${id}`,
            photoUri: (id) => `file:///${id}`,
            readAudio: () => Promise.resolve(null),
            readPhoto: () => Promise.resolve(null),
            writeAudio: () => Promise.resolve(),
            writePhoto: () => Promise.resolve(),
        };
        const backup = await buildBackup(files);
        await suite.db().clear();
        await restoreBackup(JSON.stringify(backup), files);
        expect(await listMyChurches(ISOLATION_OWNER)).toHaveLength(count);
        expect((await resolveActiveChurch(ISOLATION_OWNER))?.id).toBe(
            churches[count - 1]?.churchId,
        );
        for (const [index, church] of churches.entries())
            expect((await listBelievers({ churchId: church.churchId })).total).toBe(index + 1);
        // La copia omite la iglesia seleccionada: reparar + resolver elige la primera accesible.
        backup.tables.churches = backup.tables.churches.filter(
            (row) => row.id !== churches[count - 1]?.churchId,
        );
        await restoreBackup(JSON.stringify(backup), files);
        const accessible = await listMyChurches(ISOLATION_OWNER);
        expect(accessible).toHaveLength(count - 1);
        expect((await resolveActiveChurch(ISOLATION_OWNER))?.id).toBe(accessible[0]?.id);
    },
);
