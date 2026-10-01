import { isolationSuite } from '../test-support/church-isolation-suite';
import { createProphecy, listProphecies } from './prophecies-repo';
import { createDream, listDreams } from './dreams-repo';
import { createTeaching, listTeachings } from './teachings-repo';
import { ISOLATION_OWNER, ISOLATION_DAY } from '../test-support/seed-two-churches';
import { useLocalSession } from '@/stores/local-session';

const suite = isolationSuite();
// I7: cambiar el espejo de sesión no debe filtrar los módulos personales.
it('I7: profecías, sueños y enseñanzas son iguales en ambas iglesias', async () => {
    const { north, south } = suite.churches();
    await createProphecy(ISOLATION_OWNER, {
        title: 'Personal',
        body: 'Profecía',
        receivedAt: ISOLATION_DAY,
    });
    await createDream(ISOLATION_OWNER, { body: 'Sueño', dreamedAt: ISOLATION_DAY });
    await createTeaching(ISOLATION_OWNER, {
        title: 'Personal',
        receivedAt: ISOLATION_DAY,
        body: {
            type: 'doc',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Enseñanza' }] }],
        },
    });
    const read = () =>
        Promise.all([
            listProphecies(ISOLATION_OWNER, {}),
            listDreams(ISOLATION_OWNER, {}),
            listTeachings(ISOLATION_OWNER, {}),
        ]);
    const before = useLocalSession.getState().session;
    try {
        useLocalSession.setState({
            session: { userId: ISOLATION_OWNER, churchId: north.churchId },
        });
        const inNorth = await read();
        expect(inNorth.map((list) => list.total)).toEqual([1, 1, 1]);
        useLocalSession.setState({
            session: { userId: ISOLATION_OWNER, churchId: south.churchId },
        });
        expect(await read()).toEqual(inNorth);
    } finally {
        useLocalSession.setState({ session: before });
    }
});
