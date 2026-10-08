import { setupLocalDb } from '@/data/test-support';
import { createAccount } from '@/data/repos/account-repo';
import { setDbForTests, getDb } from '@/data/db';
import { createChurch } from '@/data/repos/church-repo';
import { buildBackup } from '@/lib/backup/create-backup';
import { restoreBackup, RestoreError } from '@/lib/backup/restore-backup';
import type { BackupFiles } from '@/lib/backup/backup-format';
import { openDatabaseAsync } from 'expo-sqlite';
import { createList } from '@/data/repos/lists-repo';
import { listCoverFileId } from '@/data/list-cover-storage';
import { createJournalEntry, findJournalEntry } from '@/data/repos/journal-repo';

jest.mock('expo-sqlite', () => ({
    __esModule: true,
    openDatabaseAsync: jest.fn(),
}));

/** Un disco en memoria: el test comprueba el contrato, no el sistema de ficheros del teléfono. */
function memoryFiles(): BackupFiles & { audios: Map<string, string> } {
    const audios = new Map<string, string>();
    const photos = new Map<string, string>();
    return {
        audios,
        audioUri: (id) => `file:///este-telefono/audios/${id}`,
        photoUri: (id) => `file:///este-telefono/photos/${id}`,
        readAudio: (id) => Promise.resolve(audios.get(id) ?? null),
        readPhoto: (id) => Promise.resolve(photos.get(id) ?? null),
        writeAudio: (id, content) => Promise.resolve(void audios.set(id, content)),
        writePhoto: (id, content) => Promise.resolve(void photos.set(id, content)),
    };
}

describe('copia de seguridad', () => {
    let db: Awaited<ReturnType<typeof setupLocalDb>>;

    beforeAll(async () => {
        db = await setupLocalDb({ setDbForTests, openDatabaseMock: openDatabaseAsync });
    });
    beforeEach(async () => {
        await db.clear();
    });
    afterAll(() => {
        db.close();
    });

    async function seed(): Promise<string> {
        const account = await createAccount({
            name: 'Ana',
            email: 'ana@iglesia.es',
            password: 'MuySegura123',
        });
        if ('error' in account) throw new Error('cuenta no creada');
        const church = await createChurch({
            name: 'Iglesia del Sur',
            city: 'Elda',
            ownerId: account.user.id,
        });
        return church.id;
    }

    // D6: una copia del esquema 10 no trae membresías ni iglesia activa.
    it('repara una copia antigua sin membresías y anula una activa inaccesible', async () => {
        const churchId = await seed();
        const files = memoryFiles();
        const backup = await buildBackup(files);
        delete backup.tables.church_members;
        for (const user of backup.tables.local_user) user.active_church_id = 'inexistente';
        await restoreBackup(JSON.stringify({ ...backup, schemaVersion: 10 }), files);
        const dbConn = await getDb();
        expect(await dbConn.getAllAsync('SELECT church_id FROM church_members')).toEqual([
            { church_id: churchId },
        ]);
        expect(await dbConn.getFirstAsync('SELECT active_church_id FROM local_user')).toEqual({
            active_church_id: null,
        });
        delete backup.tables.local_user[0].active_church_id;
        await restoreBackup(JSON.stringify({ ...backup, schemaVersion: 10 }), files);
        expect(await dbConn.getAllAsync('SELECT church_id FROM church_members')).toEqual([
            { church_id: churchId },
        ]);
    });

    it('restaura lo que había al hacer la copia y trae de vuelta los audios', async () => {
        await seed();
        const files = memoryFiles();
        const dbConn = await getDb();
        const backup = await buildBackup(files);
        const beforeChurches = backup.tables.churches.length;
        await db.clear();
        expect((await dbConn.getAllAsync('SELECT id FROM churches')).length).toBe(0);

        await restoreBackup(JSON.stringify({ ...backup, audios: { a1: 'QVVESU8=' } }), files);
        expect(files.audios.get('a1')).toBe('QVVESU8=');

        expect((await dbConn.getAllAsync('SELECT id FROM churches')).length).toBe(beforeChurches);
        const user = await dbConn.getFirstAsync<{ email: string }>('SELECT email FROM local_user');
        expect(user?.email).toBe('ana@iglesia.es');
    });

    // Regresión, dos veces: `SELECT *` sacaba columnas muertas y restaurar daba «no
    // es una copia de Navis»; y al quitarlas todas se perdía `believers.featured_tag_id`,
    // que el código todavía lee (la etiqueta destacada). Con una fila real de creyentes.
    it('restaura una copia con filas de creyentes y conserva su etiqueta destacada', async () => {
        const churchId = await seed();
        const dbConn = await getDb();
        await dbConn.runAsync(
            "INSERT INTO believers (id, created_at, updated_at, church_id, first_name, last_name, search_name, featured_tag_id) VALUES ('b1', 't', 't', ?, 'Luis', 'Mora', 'luis mora', 'x')",
            churchId,
        );
        const files = memoryFiles();

        const backup = await buildBackup(files);
        await db.clear();
        await restoreBackup(JSON.stringify(backup), files);

        const believer = await dbConn.getFirstAsync<{
            first_name: string;
            featured_tag_id: string | null;
        }>('SELECT first_name, featured_tag_id FROM believers WHERE id = ?', 'b1');
        expect(believer?.first_name).toBe('Luis');
        expect(believer?.featured_tag_id).toBe('x');
    });

    it('rechaza un fichero que no es una copia de Navis sin tocar nada', async () => {
        await seed();
        const dbConn = await getDb();

        await expect(restoreBackup('{"hola":1}', memoryFiles())).rejects.toMatchObject({
            code: 'invalid',
        });
        await expect(restoreBackup('no es json', memoryFiles())).rejects.toBeInstanceOf(
            RestoreError,
        );
        expect((await dbConn.getAllAsync('SELECT id FROM churches')).length).toBe(1);
    });

    it('restaura el cuaderno completo y relocaliza sus audios en el teléfono de destino', async () => {
        const churchId = await seed(),
            dbConn = await getDb();
        const user = await dbConn.getFirstAsync<{ id: string }>('SELECT id FROM local_user');
        const context = { churchId, userId: user!.id };
        const id = await createJournalEntry(context, {
            title: 'Con audio',
            kind: 'oracion',
            occurredAt: '2026-10-04',
            annotation: 'Texto completo',
            learned: 'Reflexión',
            remindAt: '2099-10-04T19:00:00',
        });
        await dbConn.runAsync(
            'INSERT INTO journal_entry_audios (id, created_at, updated_at, church_id, entry_id, mime_type, size_bytes, recorded, storage_key) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            'journal-audio',
            'now',
            'now',
            churchId,
            id,
            'audio/mp4',
            12,
            1,
            'file:///otro-telefono/voz.m4a',
        );
        const files = memoryFiles();
        await files.writeAudio('journal-audio', 'Vk9a');
        const backup = await buildBackup(files);
        expect(backup.audios['journal-audio']).toBe('Vk9a');
        await db.clear();
        await restoreBackup(JSON.stringify(backup), files);
        const entry = await findJournalEntry(context, id);
        expect(entry?.annotation).toBe('Texto completo');
        expect(entry?.learned).toBe('Reflexión');
        expect(entry?.remindAt).toBe(new Date('2099-10-04T19:00:00').toISOString());
        expect(entry?.audios[0]?.uri).toBe(files.audioUri('journal-audio'));
    });

    it('restaura las listas y localiza su portada en el teléfono de destino', async () => {
        const churchId = await seed();
        const dbConn = await getDb();
        const user = await dbConn.getFirstAsync<{ id: string }>('SELECT id FROM local_user');
        const id = await createList({ churchId, userId: user!.id }, { name: 'Equipo' });
        await dbConn.runAsync(
            'UPDATE lists SET cover_key = ? WHERE id = ?',
            'file:///otro/cover',
            id,
        );
        const files = memoryFiles();
        await files.writePhoto(listCoverFileId(id), 'UE9SVEFEQQ==');
        const backup = await buildBackup(files);
        expect(backup.photos[listCoverFileId(id)]).toBe('UE9SVEFEQQ==');
        await db.clear();
        await restoreBackup(JSON.stringify(backup), files);
        expect(
            await dbConn.getFirstAsync('SELECT name, cover_key FROM lists WHERE id = ?', id),
        ).toEqual({ name: 'Equipo', cover_key: files.photoUri(listCoverFileId(id)) });
    });

    it('rechaza una copia hecha con un esquema más nuevo que el de esta app', async () => {
        const backup = await buildBackup(memoryFiles());
        await expect(
            restoreBackup(JSON.stringify({ ...backup, schemaVersion: 999 }), memoryFiles()),
        ).rejects.toMatchObject({ code: 'newer' });
    });

    it('rechaza tablas o columnas que la app no conoce (no se fía de los nombres)', async () => {
        await seed();
        const backup = await buildBackup(memoryFiles());
        const evil = { ...backup, tables: { ...backup.tables, 'churches; DROP TABLE x': [] } };
        await expect(restoreBackup(JSON.stringify(evil), memoryFiles())).rejects.toMatchObject({
            code: 'invalid',
        });
        const badColumn = {
            ...backup,
            tables: { ...backup.tables, churches: [{ 'id") --': 'x' }] },
        };
        await expect(restoreBackup(JSON.stringify(badColumn), memoryFiles())).rejects.toMatchObject(
            { code: 'invalid' },
        );
    });
});
