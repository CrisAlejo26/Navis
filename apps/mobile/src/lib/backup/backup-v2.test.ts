import '@/data/test-support';
import * as SecureStore from 'expo-secure-store';

import { getDb } from '@/data/db';
import { addJournalAudio } from '@/data/repos/journal-audios';
import { createJournalEntry, listJournal } from '@/data/repos/journal-repo';
import { tasksFixture } from '@/data/repos/tasks-test-support';
import { saveCredential } from '@/lib/sync/credential';
import { useSyncConnection } from '@/stores/sync-connection';

import type { BackupFiles } from './backup-format';
import { buildBackup } from './create-backup';
import { PackagePasswordError, sealPackage } from './package-crypto';
import { inspectBackup, restoreBackup } from './restore-backup';
import {
    createSafetyBackup,
    SAFETY_KEEP,
    SafetyBackupError,
    type SafetyStore,
} from './safety-backup';
import { asV1Copy } from './test-copies';

jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn() }));
jest.mock('@/data/audio-storage', () => ({
    storeAudio: (id: string) => Promise.resolve(`old://${id}`),
    removeAudioAt: jest.fn(),
}));

const PASSWORD = 'una-contraseña-larga-2026';

function filesWith(audio: string | null): BackupFiles & { written: Map<string, string> } {
    const written = new Map<string, string>();
    return {
        written,
        audioUri: (id) => `new://${id}`,
        photoUri: (id) => id,
        readAudio: () => Promise.resolve(audio),
        readPhoto: () => Promise.resolve(null),
        writeAudio: (id, content) => Promise.resolve(void written.set(id, content)),
        writePhoto: () => Promise.resolve(),
    };
}

function memoryStore(): SafetyStore & { files: Map<string, string> } {
    const files = new Map<string, string>();
    return {
        files,
        write: (name, text) => Promise.resolve(void files.set(name, text)),
        read: (name) => Promise.resolve(files.get(name) ?? null),
        list: () => Promise.resolve([...files.keys()]),
        remove: (name) => Promise.resolve(void files.delete(name)),
        uri: (name) => `file:///privado/safety/${name}`,
    };
}

describe('copia de seguridad v2', () => {
    const { contexts: c, clear } = tasksFixture();

    async function seedEntry(): Promise<string> {
        const id = await createJournalEntry(c.north, {
            title: 'Con audio',
            kind: 'testimonio',
            occurredAt: '2026-10-08',
            annotation: 'Texto',
            learned: 'Escuchar',
        });
        await addJournalAudio(c.north, id, {
            sourceUri: 'source://recording',
            mimeType: 'audio/mp4',
            sizeBytes: 4,
            durationSeconds: 12,
            recorded: true,
        });
        return id;
    }

    describe('manifiesto e integridad', () => {
        it('cuenta filas y ficheros, anota el origen y se verifica sola', async () => {
            await seedEntry();
            const backup = await buildBackup(filesWith('AQIDBA=='), undefined, {
                origin: { appVersion: '1.2.3', platform: 'android' },
            });

            expect(backup.version).toBe(2);
            expect(backup.origin).toEqual({ appVersion: '1.2.3', platform: 'android' });
            expect(backup.manifest?.tables.journal_entries).toBe(1);
            expect(backup.manifest?.audios).toHaveLength(1);
            expect(backup.manifest?.audios[0]).toMatchObject({ bytes: 8 });
            expect(backup.manifest?.missing).toEqual({ audios: [], photos: [] });
            await expect(inspectBackup(JSON.stringify(backup))).resolves.toMatchObject({
                missingFiles: 0,
            });
        });

        it('rechaza una copia retocada o truncada antes de tocar nada', async () => {
            await seedEntry();
            const files = filesWith('AQIDBA=='),
                backup = await buildBackup(files);
            const before = (await listJournal(c.north, {})).total;

            const edited = structuredClone(backup);
            const entry = edited.tables.journal_entries?.[0];
            if (entry) entry.title = 'Otro título';
            await expect(restoreBackup(JSON.stringify(edited), files)).rejects.toMatchObject({
                code: 'corrupt',
            });

            const truncated = structuredClone(backup);
            truncated.audios = {};
            await expect(restoreBackup(JSON.stringify(truncated), files)).rejects.toMatchObject({
                code: 'corrupt',
            });

            expect((await listJournal(c.north, {})).total).toBe(before);
        });

        it('anota los ficheros que no se pudieron leer y avisa al restaurar', async () => {
            await seedEntry();
            const files = filesWith(null);
            const backup = await buildBackup(files);

            expect(backup.manifest?.missing.audios).toHaveLength(1);
            expect(backup.audios).toEqual({});
            await clear();
            const report = await restoreBackup(JSON.stringify(backup), files);
            expect(report.missingFiles).toBe(1);
        });

        it('las copias anteriores (v1, sin manifiesto) se siguen restaurando', async () => {
            await seedEntry();
            const files = filesWith('AQIDBA==');
            const legacy = asV1Copy(await buildBackup(files));
            await clear();
            const report = await restoreBackup(JSON.stringify(legacy), files);
            expect(report.missingFiles).toBe(0);
            expect((await listJournal(c.north, {})).total).toBe(1);
        });

        it('lee todas las tablas dentro de una sola transacción (copia coherente)', async () => {
            await seedEntry();
            const db = await getDb();
            const spy = jest.spyOn(db, 'withTransactionAsync');
            await buildBackup(filesWith('AQIDBA=='));
            expect(spy).toHaveBeenCalledTimes(1);
            spy.mockRestore();
        });
    });

    describe('cifrado del paquete', () => {
        it('cifra todo el fichero, lo restaura con la contraseña y no deja nada en claro', async () => {
            await seedEntry();
            const files = filesWith('AQIDBA==');
            const backup = await buildBackup(files, PASSWORD);
            const sealed = JSON.stringify(await sealPackage(JSON.stringify(backup), PASSWORD));

            expect(sealed).not.toContain('Con audio');
            expect(sealed).not.toContain('journal_entries');
            await clear();
            await restoreBackup(sealed, files, PASSWORD);
            expect((await listJournal(c.north, {})).total).toBe(1);
        });

        it('una contraseña equivocada, ausente o un fichero alterado fallan igual y no tocan nada', async () => {
            await seedEntry();
            const files = filesWith('AQIDBA==');
            const sealed = await sealPackage(JSON.stringify(await buildBackup(files)), PASSWORD);
            const before = (await listJournal(c.north, {})).total;

            await expect(
                restoreBackup(JSON.stringify(sealed), files, 'otra-contraseña-larga-1'),
            ).rejects.toMatchObject({ code: 'password' });
            await expect(restoreBackup(JSON.stringify(sealed), files)).rejects.toMatchObject({
                code: 'password',
            });
            const flipped = {
                ...sealed,
                sealed: `${sealed.sealed.slice(0, 40)}${sealed.sealed[40] === 'A' ? 'B' : 'A'}${sealed.sealed.slice(41)}`,
            };
            await expect(
                restoreBackup(JSON.stringify(flipped), files, PASSWORD),
            ).rejects.toMatchObject({ code: 'password' });
            expect((await listJournal(c.north, {})).total).toBe(before);
        });

        it('no cifra con una contraseña corta', async () => {
            await expect(sealPackage('{}', 'corta')).rejects.toBeInstanceOf(PackagePasswordError);
        });
    });

    describe('credenciales remotas', () => {
        it('una copia nunca lleva la credencial del dispositivo ni la conexión', async () => {
            await seedEntry();
            await saveCredential('nvd_credencial-secreta-de-prueba');
            useSyncConnection.setState({
                link: {
                    apiUrl: 'https://navis.org/api/v1',
                    installationName: 'Navis',
                    deviceId: '8f0a1c52-7f6e-4d38-9a40-0f6d6a5b1c11',
                    deviceName: 'Pixel',
                    account: { id: 'u1', name: 'Ana', email: 'ana@navis.test' },
                    linkedAt: '2026-10-09T10:00:00.000Z',
                    identities: [],
                },
            });
            const text = JSON.stringify(await buildBackup(filesWith('AQIDBA=='), PASSWORD));

            expect(text).not.toContain('nvd_');
            expect(text).not.toContain('navis.org');
            expect(await SecureStore.getItemAsync('navis.sync.credential')).not.toBeNull();
            useSyncConnection.setState({ link: null });
        });
    });

    describe('copia previa a una operación', () => {
        it('deja una copia verificada, sin claves portables', async () => {
            await seedEntry();
            const store = memoryStore();
            const copy = await createSafetyBackup('restore', filesWith('AQIDBA=='), store);

            expect(copy.reason).toBe('restore');
            expect(copy.uri).toContain('/safety/');
            const text = store.files.get(copy.name);
            expect(text).toBeDefined();
            const inspected = await inspectBackup(text ?? '');
            expect(inspected.backup.tableKeys).toBeUndefined();
        });

        it('conserva solo las últimas y borra las más viejas', async () => {
            await seedEntry();
            const store = memoryStore();
            for (let i = 0; i < SAFETY_KEEP + 3; i += 1) {
                await createSafetyBackup('connect', filesWith('AQIDBA=='), store);
                await new Promise((resolve) => setTimeout(resolve, 2));
            }
            expect(store.files.size).toBe(SAFETY_KEEP);
        });

        it('si no se puede volver a leer, falla y no deja un fichero a medias', async () => {
            await seedEntry();
            const store = { ...memoryStore(), read: () => Promise.resolve(null) };
            await expect(
                createSafetyBackup('disconnect', filesWith('AQIDBA=='), store),
            ).rejects.toBeInstanceOf(SafetyBackupError);
            expect(store.files.size).toBe(0);
        });
    });
});
