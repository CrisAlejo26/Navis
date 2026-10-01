import { isolationSuite } from '../test-support/church-isolation-suite';
import { ISOLATION_OWNER } from '../test-support/seed-two-churches';
import { getDb } from '../db';
import { listPendingNoteReminders } from './note-reminders-repo';
import { updateNote } from './notes-repo';
import { createChurch } from './church-repo';
const suite = isolationSuite();

// A4: las membresías, no la iglesia activa, deciden qué recordatorios se programan.
it('incluye ambas iglesias, excluye bajas, otras autorías y referencias cruzadas', async () => {
    const { north, south } = suite.churches();
    for (const church of [north, south]) {
        await updateNote(
            church.noteId,
            church.believerId,
            { remindAt: '2027-01-01T12:00:00' },
            church.churchId,
        );
    }
    const db = await getDb();
    const reminders = await listPendingNoteReminders(ISOLATION_OWNER);
    expect(reminders.map((r) => r.churchName).sort()).toEqual(['N-Iglesia', 'S-Iglesia']);
    expect(reminders.map((r) => r.churchId).sort()).toEqual(
        [north.churchId, south.churchId].sort(),
    );
    expect(await listPendingNoteReminders('otro')).toEqual([]);
    await db.runAsync(
        'UPDATE church_members SET deleted_at = ? WHERE church_id = ?',
        't',
        south.churchId,
    );
    expect((await listPendingNoteReminders(ISOLATION_OWNER)).map((r) => r.noteId)).toEqual([
        north.noteId,
    ]);
    await db.runAsync(
        'UPDATE church_members SET deleted_at = NULL WHERE church_id = ?',
        south.churchId,
    );
    await db.runAsync('UPDATE churches SET deleted_at = ? WHERE id = ?', 't', south.churchId);
    expect(await listPendingNoteReminders(ISOLATION_OWNER)).toHaveLength(1);
    await db.runAsync('UPDATE churches SET deleted_at = NULL WHERE id = ?', south.churchId);
    await db.runAsync('UPDATE believer_notes SET author_id = ? WHERE id = ?', 'otro', south.noteId);
    expect(await listPendingNoteReminders(ISOLATION_OWNER)).toHaveLength(1);
    await db.runAsync(
        'UPDATE believer_notes SET author_id = NULL, believer_id = ? WHERE id = ?',
        north.believerId,
        south.noteId,
    );
    expect(await listPendingNoteReminders(ISOLATION_OWNER)).toHaveLength(1);
    // Ser dueño sin membresía no da acceso implícito a un recordatorio.
    await createChurch({ name: 'Sin acceso', city: 'Elda', ownerId: 'otro' });
    await db.runAsync(
        'UPDATE church_members SET deleted_at = ? WHERE user_id = ?',
        't',
        ISOLATION_OWNER,
    );
    expect(await listPendingNoteReminders(ISOLATION_OWNER)).toEqual([]);
});
