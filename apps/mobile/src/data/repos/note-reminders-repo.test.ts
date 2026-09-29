// Primero el soporte: registra los mocks de expo-crypto/expo-secure-store
// antes de que carguen los módulos que los usan.
import { setupLocalDb } from '@/data/test-support';
import { setDbForTests } from '@/data/db';
import { createBeliever } from '@/data/repos/believers-repo';
import { listPendingNoteReminders } from '@/data/repos/note-reminders-repo';
import { createNote, deleteNote, updateNote } from '@/data/repos/notes-repo';
import { openDatabaseAsync } from 'expo-sqlite';

jest.mock('expo-sqlite', () => ({
    __esModule: true,
    openDatabaseAsync: jest.fn(),
}));

describe('los recordatorios de notas que esperan aviso', () => {
    let db: Awaited<ReturnType<typeof setupLocalDb>>;
    const churchId = 'iglesia-a';
    const userId = 'usuario-a';
    let believerId: string;

    beforeAll(async () => {
        db = await setupLocalDb({ setDbForTests, openDatabaseMock: openDatabaseAsync });
    });

    afterAll(() => {
        db.close();
    });

    beforeEach(async () => {
        await db.clear();
        believerId = await createBeliever(churchId, { firstName: 'Marta', lastName: 'Ruiz' });
    });

    const withReminder = (told: string, remindAt: string | null, remindText?: string) =>
        createNote(believerId, churchId, userId, {
            kind: 'seguimiento',
            occurredAt: '2026-09-29',
            told,
            remindAt,
            remindText,
        });

    it('devuelve la nota con su recordatorio y el nombre del hermano', async () => {
        const noteId = await withReminder(
            'Contó que estaba mejor',
            '2026-10-01T19:30:00',
            'Llamarla',
        );

        expect(await listPendingNoteReminders(churchId, userId)).toEqual([
            {
                noteId,
                believerId,
                firstName: 'Marta',
                lastName: 'Ruiz',
                remindAt: '2026-10-01T19:30:00',
                remindText: 'Llamarla',
            },
        ]);
    });

    it('no devuelve las notas sin recordatorio, las dadas por hechas ni las borradas', async () => {
        await withReminder('Sin recordatorio', null);
        const hecho = await withReminder('Ya hecha', '2026-10-01T19:30:00');
        await updateNote(hecho, believerId, { remindDone: true });
        const borrada = await withReminder('Borrada', '2026-10-02T19:30:00');
        await deleteNote(borrada, believerId);

        expect(await listPendingNoteReminders(churchId, userId)).toEqual([]);
    });

    it('quitar el recordatorio de una nota la saca de la lista', async () => {
        const noteId = await withReminder('Se cancela', '2026-10-01T19:30:00');
        await updateNote(noteId, believerId, { remindAt: null, remindText: null });

        expect(await listPendingNoteReminders(churchId, userId)).toEqual([]);
    });

    it('solo trae los de la iglesia y de la persona con la sesión', async () => {
        await withReminder('Mío', '2026-10-01T19:30:00');
        await createNote(believerId, churchId, 'usuario-b', {
            kind: 'seguimiento',
            occurredAt: '2026-09-29',
            told: 'De otro',
            remindAt: '2026-10-01T20:00:00',
        });

        const mine = await listPendingNoteReminders(churchId, userId);
        expect(mine).toHaveLength(1);
        expect(await listPendingNoteReminders('iglesia-b', userId)).toEqual([]);
    });
});
