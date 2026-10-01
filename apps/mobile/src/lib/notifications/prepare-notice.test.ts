import { isolationSuite } from '@/data/test-support/church-isolation-suite';
import { ISOLATION_OWNER } from '@/data/test-support/seed-two-churches';
import { getDb } from '@/data/db';
import { prepareNotice } from './prepare-notice';
import { useLocalSession } from '@/stores/local-session';
const suite = isolationSuite();

it('abre en la activa sin cambiar y descarta avisos sin hidratación o de otra autoría', async () => {
    const { north } = suite.churches();
    const before = useLocalSession.getState();
    const session = { userId: ISOLATION_OWNER, churchId: north.churchId };
    useLocalSession.setState({ session, hydrated: true });
    const change = jest.fn();
    const data = {
        type: 'note-reminder',
        churchId: north.churchId,
        noteId: north.noteId,
        believerId: north.believerId,
    };
    try {
        expect(await prepareNotice(data, change)).toEqual({
            data,
            switched: false,
            userId: ISOLATION_OWNER,
        });
        useLocalSession.setState({ hydrated: false });
        expect(await prepareNotice(data, change)).toBeNull();
        useLocalSession.setState({ hydrated: true });
        await (
            await getDb()
        ).runAsync('UPDATE believer_notes SET author_id = ? WHERE id = ?', 'otro', north.noteId);
        expect(await prepareNotice(data, change)).toBeNull();
        expect(change).not.toHaveBeenCalled();
    } finally {
        useLocalSession.setState({ session: before.session, hydrated: before.hydrated });
    }
});

it('ignora avisos inválidos, notas borradas y referencias cruzadas sin cambiar contexto', async () => {
    const { north, south } = suite.churches();
    const before = useLocalSession.getState();
    useLocalSession.setState({
        session: { userId: ISOLATION_OWNER, churchId: north.churchId },
        hydrated: true,
    });
    const change = jest.fn();
    const data = {
        type: 'note-reminder',
        churchId: south.churchId,
        noteId: south.noteId,
        believerId: south.believerId,
    };
    try {
        expect(await prepareNotice(undefined, change)).toBeNull();
        expect(await prepareNotice({ ...data, churchId: undefined }, change)).toBeNull();
        expect(await prepareNotice({ ...data, believerId: north.believerId }, change)).toBeNull();
        expect(await prepareNotice({ ...data, noteId: north.noteId }, change)).toBeNull();
        const db = await getDb();
        await db.runAsync(
            'UPDATE believers SET deleted_at = ? WHERE id = ?',
            't',
            south.believerId,
        );
        expect(await prepareNotice(data, change)).toBeNull();
        await db.runAsync('UPDATE believers SET deleted_at = NULL WHERE id = ?', south.believerId);
        await db.runAsync(
            'UPDATE believer_notes SET deleted_at = ? WHERE id = ?',
            't',
            south.noteId,
        );
        expect(await prepareNotice(data, change)).toBeNull();
        await db.runAsync(
            'UPDATE church_members SET deleted_at = ? WHERE church_id = ?',
            't',
            south.churchId,
        );
        await expect(prepareNotice(data, change)).rejects.toThrow();
        expect(change).not.toHaveBeenCalled();
        expect(useLocalSession.getState().session?.churchId).toBe(north.churchId);
    } finally {
        useLocalSession.setState({ session: before.session, hydrated: before.hydrated });
    }
});
