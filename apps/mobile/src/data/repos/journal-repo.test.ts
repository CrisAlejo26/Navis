import { setupLocalDb } from '@/data/test-support';
import { getDb, setDbForTests } from '@/data/db';
import { openDatabaseAsync } from 'expo-sqlite';
import { createChurch } from './church-repo';
import {
    createJournalEntry,
    deleteJournalEntry,
    findJournalEntry,
    journalStats,
    listJournal,
    updateJournalEntry,
    type JournalContext,
} from './journal-repo';
import { addJournalAudio, deleteJournalAudio } from './journal-audios';
import { entryMarkdown } from '@/lib/journal/export';
import { planJournalReminders } from '@/lib/notifications/plan-journal-reminders';
import { migrateJournal } from '../journal-migration';

jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn() }));
jest.mock('../audio-storage', () => ({
    storeAudio: jest.fn((id: string) => Promise.resolve(`file:///${id}.m4a`)),
    removeAudioAt: jest.fn(),
}));
jest.mock('expo-sharing', () => ({
    isAvailableAsync: jest.fn(() => Promise.resolve(true)),
    shareAsync: jest.fn(),
}));

describe('cuaderno local: datos completos, permisos y avisos', () => {
    let db: Awaited<ReturnType<typeof setupLocalDb>>;
    let north: JournalContext, south: JournalContext;
    const input = {
        title: 'Corrección con cariño',
        kind: 'observacion' as const,
        occurredAt: '2026-10-04',
        annotation: 'Conversación íntegra '.repeat(40),
        learned: 'Paciencia y oración',
    };
    beforeAll(async () => {
        db = await setupLocalDb({ setDbForTests, openDatabaseMock: openDatabaseAsync });
    });
    afterAll(() => db.close());
    beforeEach(async () => {
        await db.clear();
        north = {
            userId: 'owner',
            churchId: (await createChurch({ name: 'Norte', city: 'Elda', ownerId: 'owner' })).id,
        };
        south = {
            userId: 'owner',
            churchId: (await createChurch({ name: 'Sur', city: 'Elda', ownerId: 'owner' })).id,
        };
    });
    it('crea y edita todos los campos sin sustituir el cuerpo por el extracto', async () => {
        const id = await createJournalEntry(north, input);
        expect((await listJournal(north, {})).items[0]?.excerpt.length).toBe(240);
        await updateJournalEntry(north, id, { title: 'Título cambiado' });
        const entry = await findJournalEntry(north, id);
        expect(entry?.annotation).toBe(input.annotation.trim());
        expect(entry?.learned).toBe(input.learned);
        expect(entry?.title).toBe('Título cambiado');
    });
    it('valida título, fecha y anotación al crear', async () => {
        await expect(createJournalEntry(north, { ...input, title: ' ' })).rejects.toThrow();
        await expect(createJournalEntry(north, { ...input, annotation: ' ' })).rejects.toThrow();
        await expect(createJournalEntry(north, { ...input, occurredAt: 'ayer' })).rejects.toThrow();
    });
    it('aísla entre iglesias lectura, edición, borrado y audios', async () => {
        const id = await createJournalEntry(north, input);
        expect(await findJournalEntry(south, id)).toBeNull();
        expect((await listJournal(south, {})).total).toBe(0);
        await expect(updateJournalEntry(south, id, { title: 'Ajena' })).rejects.toThrow(
            'not-found',
        );
        await expect(deleteJournalEntry(south, id)).rejects.toThrow('not-found');
        await expect(
            addJournalAudio(south, id, {
                sourceUri: 'file:///a',
                mimeType: 'audio/mp4',
                sizeBytes: 10,
                durationSeconds: 2,
                recorded: true,
            }),
        ).rejects.toThrow('not-found');
    });
    it('un miembro puede leer, pero solo el dueño puede gestionar', async () => {
        const id = await createJournalEntry(north, input),
            database = await getDb();
        await database.runAsync(
            'INSERT INTO church_members (id, church_id, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
            'member',
            north.churchId,
            'reader',
            'now',
            'now',
        );
        const reader = { ...north, userId: 'reader' };
        expect((await findJournalEntry(reader, id))?.id).toBe(id);
        await expect(createJournalEntry(reader, input)).rejects.toThrow('not-found');
        await expect(listJournal({ ...north, userId: 'outsider' }, {})).rejects.toThrow(
            'not-found',
        );
    });
    it('busca sin acentos en título, anotación y reflexión y escapa LIKE', async () => {
        await createJournalEntry(north, input);
        expect((await listJournal(north, { search: 'CORRECCION' })).total).toBe(1);
        expect((await listJournal(north, { search: 'íntegra' })).total).toBe(1);
        expect((await listJournal(north, { search: 'oracion' })).total).toBe(1);
        expect((await listJournal(north, { search: '%' })).total).toBe(0);
        await updateJournalEntry(north, (await listJournal(north, {})).items[0].id, {
            learned: 'Una reflexión distinta',
        });
        expect((await listJournal(north, { search: 'oracion' })).total).toBe(0);
    });
    it('combina tipos y fechas, ordena y pagina con resultados exactos', async () => {
        await createJournalEntry(north, {
            ...input,
            title: 'B',
            kind: 'decision',
            occurredAt: '2026-01-01',
        });
        await createJournalEntry(north, { ...input, title: 'A', kind: 'oracion' });
        await createJournalEntry(north, { ...input, title: 'C', kind: 'testimonio' });
        const page = await listJournal(north, {
            kind: ['oracion', 'testimonio'],
            from: '2026-10-01',
            to: '2026-10-31',
            sort: 'title',
            order: 'asc',
            limit: 1,
            page: 2,
        });
        expect(page.total).toBe(2);
        expect(page.items[0]?.title).toBe('C');
        expect(page.totalPages).toBe(2);
    });
    it('atiende, reabre y elimina recordatorios; cambiar fecha los devuelve a pendiente', async () => {
        const id = await createJournalEntry(north, {
            ...input,
            remindAt: '2099-10-04T19:00:00',
            remindText: 'Volver a hablar',
        });
        await updateJournalEntry(north, id, { remindDone: true });
        expect((await listJournal(north, { pendingReminder: true })).total).toBe(0);
        await updateJournalEntry(north, id, { remindDone: false });
        expect((await listJournal(north, { pendingReminder: true })).total).toBe(1);
        await updateJournalEntry(north, id, { remindDone: true });
        await updateJournalEntry(north, id, { remindAt: '2099-10-05T19:00:00' });
        expect((await findJournalEntry(north, id))?.remindDoneAt).toBeNull();
        await updateJournalEntry(north, id, { remindAt: null });
        expect((await findJournalEntry(north, id))?.remindText).toBeNull();
    });
    it('guarda y elimina audios y el borrado de entrada los oculta', async () => {
        const id = await createJournalEntry(north, input);
        await addJournalAudio(north, id, {
            sourceUri: 'file:///recording',
            mimeType: 'audio/mp4',
            sizeBytes: 20,
            durationSeconds: 12,
            recorded: true,
        });
        const entry = await findJournalEntry(north, id),
            audioId = entry!.audios[0].id;
        expect(entry?.audios[0]?.durationSeconds).toBe(12);
        expect((await listJournal(north, {})).items[0]?.hasAudio).toBe(true);
        await expect(deleteJournalAudio(south, id, audioId)).rejects.toThrow('not-found');
        await deleteJournalAudio(north, id, audioId);
        expect((await findJournalEntry(north, id))?.audios).toHaveLength(0);
        await addJournalAudio(north, id, {
            sourceUri: 'file:///recording',
            mimeType: 'audio/mp4',
            sizeBytes: 20,
            durationSeconds: 12,
            recorded: true,
        });
        await deleteJournalEntry(north, id);
        expect(await findJournalEntry(north, id)).toBeNull();
        expect((await journalStats(north)).total).toBe(0);
        expect(
            await (
                await getDb()
            ).getFirstAsync(
                'SELECT id FROM journal_entry_audios WHERE entry_id = ? AND deleted_at IS NULL',
                id,
            ),
        ).toBeNull();
    });
    it('cuenta tipos, meses y pendientes solo en la iglesia activa', async () => {
        await createJournalEntry(north, input);
        await createJournalEntry(north, {
            ...input,
            kind: 'oracion',
            remindAt: '2099-10-04T19:00:00',
        });
        await createJournalEntry(south, input);
        const stats = await journalStats(north);
        expect(stats.total).toBe(2);
        expect(stats.byKind.oracion).toBe(1);
        expect(stats.pendingReminders).toBe(1);
        expect(stats.monthly).toHaveLength(12);
    });
    it('exporta el cuerpo completo y la reflexión, no el extracto', async () => {
        const id = await createJournalEntry(north, input),
            entry = await findJournalEntry(north, id);
        expect(entryMarkdown(entry!)).toContain(input.annotation.trim());
        expect(entryMarkdown(entry!)).toContain(input.learned);
    });
    it('programa solo avisos futuros del autor y quita los atendidos', async () => {
        const id = await createJournalEntry(north, {
            ...input,
            remindAt: '2099-10-04T19:00:00',
            remindText: 'Hablar',
        });
        await createJournalEntry(south, { ...input, remindAt: '2099-10-05T19:00:00' });
        expect(await planJournalReminders('outsider')).toEqual([]);
        const planned = await planJournalReminders('owner', new Date('2099-10-04T18:00:00'));
        expect(planned).toHaveLength(2);
        expect(planned[0]?.body).toBe('Hablar');
        await updateJournalEntry(north, id, { remindDone: true });
        expect(await planJournalReminders('owner', new Date('2099-10-04T18:00:00'))).toHaveLength(
            1,
        );
        expect(await planJournalReminders('owner', new Date('2100-01-01'))).toHaveLength(0);
    });
    it('la migración se puede repetir conservando las entradas', async () => {
        const id = await createJournalEntry(north, input);
        await migrateJournal(await getDb());
        await migrateJournal(await getDb());
        expect((await findJournalEntry(north, id))?.title).toBe(input.title);
    });
});
