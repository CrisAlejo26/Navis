import { setupLocalDb } from '@/data/test-support';
import { openDatabaseAsync } from 'expo-sqlite';

import { getDb, setDbForTests } from '@/data/db';

import { currentDestination, setCaptureDestination } from './capture';
import { FakeSyncServer } from './fake-sync-server';
import { insertSample } from './test-rows';
import { createSyncRunner, type RunnerStatus } from './sync-runner';

jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn() }));

const LINK = { apiUrl: 'https://navis.test/api/v1', account: { id: 'cuenta-1' } };
const DESTINATION = 'https://navis.test/api/v1|cuenta-1';

let fixture: Awaited<ReturnType<typeof setupLocalDb>>;
beforeAll(async () => {
    fixture = await setupLocalDb({ setDbForTests, openDatabaseMock: openDatabaseAsync });
});
beforeEach(() => fixture.clear());
afterAll(() => fixture.close());

function harness(server: FakeSyncServer, link: typeof LINK | null = LINK) {
    const updates: Record<string, unknown>[] = [];
    const status: RunnerStatus = { set: (partial) => void updates.push(partial) };
    const scheduled: { callback: () => void; delay: number }[] = [];
    const runner = createSyncRunner({
        getLink: () => link,
        getDb,
        makeApi: () => Promise.resolve(server),
        status,
        now: () => '2026-10-09T10:00:00.000Z',
        schedule: (callback, delay) => {
            scheduled.push({ callback, delay });
            return scheduled.length;
        },
        cancel: () => undefined,
    });
    return { runner, updates, scheduled };
}

describe('coordinador de sincronización', () => {
    it('sin vínculo no hace nada y no apaga el registro (una tarea de fondo puede ejecutarse antes de leer el vínculo)', async () => {
        const db = await getDb();
        await setCaptureDestination(db, DESTINATION);
        const { runner } = harness(new FakeSyncServer(), null);

        expect(await runner.syncNow()).toBeNull();
        expect(await currentDestination(db)).toBe(DESTINATION);
    });

    it('aplaza la vuelta automática con batería baja, pero no la que pide la persona', async () => {
        const server = new FakeSyncServer();
        const runner = createSyncRunner({
            getLink: () => LINK,
            getDb,
            makeApi: () => Promise.resolve(server),
            status: { set: () => undefined },
            shouldDefer: () => Promise.resolve(true),
        });

        expect(await runner.syncNow()).toBeNull();
        expect(server.calls).toEqual([]);
        expect((await runner.syncNow({ manual: true }))?.state).toBe('connected');
    });

    it('al sincronizar alinea el registro con el vínculo y anota la hora si todo fue bien', async () => {
        const server = new FakeSyncServer();
        const { runner, updates } = harness(server);
        const result = await runner.syncNow();

        expect(result?.state).toBe('connected');
        expect(await currentDestination(await getDb())).toBe(DESTINATION);
        expect(updates.at(-1)).toMatchObject({
            running: false,
            state: 'connected',
            lastSyncAt: '2026-10-09T10:00:00.000Z',
        });
    });

    it('solo hay una vuelta a la vez: las llamadas simultáneas comparten la misma', async () => {
        const server = new FakeSyncServer();
        const { runner } = harness(server);
        const [a, b, c] = await Promise.all([runner.syncNow(), runner.syncNow(), runner.syncNow()]);

        expect(a).toBe(b);
        expect(b).toBe(c);
        expect(server.calls.filter((call) => call === 'capabilities')).toHaveLength(1);
    });

    it('sin red reintenta con espera creciente y al volver la red vuelve a intentarlo solo', async () => {
        const server = new FakeSyncServer();
        server.online = false;
        const { runner, scheduled } = harness(server);
        await fixture.clear();
        await runner.syncNow(); // alinea el destino
        await insertSample('believers');

        await runner.syncNow();
        expect(scheduled).toHaveLength(2);
        expect(scheduled[1].delay).toBeGreaterThanOrEqual(scheduled[0].delay);

        server.online = true;
        scheduled[1].callback();
        // Deja que la vuelta programada termine.
        await runner.syncNow();
        expect(server.executed).toBe(1);
    });

    it('un 401 no se reintenta solo: necesita a la persona', async () => {
        const server = new FakeSyncServer();
        server.authorized = false;
        const { runner, scheduled, updates } = harness(server);
        await runner.syncNow();

        expect(updates.at(-1)).toMatchObject({ state: 'needsAuth' });
        expect(scheduled).toHaveLength(0);
    });

    it('sin credencial no intenta nada y lo dice', async () => {
        const updates: Record<string, unknown>[] = [];
        const runner = createSyncRunner({
            getLink: () => LINK,
            getDb,
            makeApi: () => Promise.resolve(null),
            status: { set: (partial) => void updates.push(partial) },
        });
        expect(await runner.syncNow()).toBeNull();
        expect(updates.at(-1)).toMatchObject({ state: 'needsAuth' });
    });

    it('refresh cuenta la cola sin hablar con el servidor', async () => {
        const server = new FakeSyncServer();
        const { runner, updates } = harness(server);
        await runner.syncNow();
        await insertSample('believers');

        await runner.refresh();
        expect(updates.at(-1)).toMatchObject({ pending: 1, conflicts: 0 });
        expect(server.calls.filter((call) => call === 'operations')).toHaveLength(0);
    });
});
