import { isolationSuite } from '@/data/test-support/church-isolation-suite';
import { ISOLATION_OWNER } from '@/data/test-support/seed-two-churches';
import { createJournalEntry, deleteJournalEntry } from '@/data/repos/journal-repo';
import { useLocalSession } from '@/stores/local-session';
import { prepareNotice } from './prepare-notice';
import { hrefForNotice } from './routes';

const suite = isolationSuite();
it('valida el aviso y cambia a su iglesia antes de abrir la entrada', async () => {
    const { north, south } = suite.churches(),
        before = useLocalSession.getState();
    const entryId = await createJournalEntry(
        { churchId: south.churchId, userId: ISOLATION_OWNER },
        { title: 'Sur', kind: 'decision', occurredAt: '2026-10-04', annotation: 'Reunión' },
    );
    const data = { type: 'journal-reminder', churchId: south.churchId, entryId };
    useLocalSession.setState({
        session: { userId: ISOLATION_OWNER, churchId: north.churchId },
        hydrated: true,
    });
    const change = jest.fn((churchId: string) => {
        useLocalSession.getState().setChurch(churchId);
        return Promise.resolve();
    });
    try {
        expect(await prepareNotice(data, change)).toMatchObject({ switched: true, data });
        expect(change).toHaveBeenCalledWith(south.churchId);
        expect(hrefForNotice(data)).toEqual({ pathname: '/journal/[id]', params: { id: entryId } });
    } finally {
        useLocalSession.setState({ session: before.session, hydrated: before.hydrated });
    }
});
it('descarta referencias cruzadas, entradas borradas y datos incompletos sin navegar', async () => {
    const { north, south } = suite.churches(),
        before = useLocalSession.getState();
    const context = { churchId: south.churchId, userId: ISOLATION_OWNER };
    const entryId = await createJournalEntry(context, {
        title: 'Sur',
        kind: 'decision',
        occurredAt: '2026-10-04',
        annotation: 'Reunión',
    });
    useLocalSession.setState({
        session: { userId: ISOLATION_OWNER, churchId: north.churchId },
        hydrated: true,
    });
    const change = jest.fn();
    try {
        expect(
            await prepareNotice(
                { type: 'journal-reminder', churchId: north.churchId, entryId },
                change,
            ),
        ).toBeNull();
        await deleteJournalEntry(context, entryId);
        expect(
            await prepareNotice(
                { type: 'journal-reminder', churchId: south.churchId, entryId },
                change,
            ),
        ).toBeNull();
        expect(hrefForNotice({ type: 'journal-reminder', churchId: north.churchId })).toBeNull();
        expect(change).not.toHaveBeenCalled();
    } finally {
        useLocalSession.setState({ session: before.session, hydrated: before.hydrated });
    }
});
