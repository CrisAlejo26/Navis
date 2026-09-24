// Primero el soporte: registra los mocks de expo-crypto/expo-secure-store
// antes de que carguen los módulos que los usan.
import { setupLocalDb } from '@/data/test-support';
import { setDbForTests } from '@/data/db';
import { createProphecy, findProphecy } from '@/data/repos/prophecies-repo';
import {
    addFulfillment,
    deleteFulfillment,
    updateFulfillment,
} from '@/data/repos/prophecy-fulfillments-repo';
import { openDatabaseAsync } from 'expo-sqlite';

jest.mock('expo-sqlite', () => ({
    __esModule: true,
    openDatabaseAsync: jest.fn(),
}));

describe('los cumplimientos de una profecía en local (RFC 0004 D4)', () => {
    let db: Awaited<ReturnType<typeof setupLocalDb>>;
    const ownerId = 'usuario-a';
    const otroOwnerId = 'usuario-b';

    beforeAll(async () => {
        db = await setupLocalDb({ setDbForTests, openDatabaseMock: openDatabaseAsync });
    });

    afterAll(() => {
        db.close();
    });

    beforeEach(async () => {
        await db.clear();
    });

    async function crearProfecia(receivedAt = '2026-03-14'): Promise<string> {
        return createProphecy(ownerId, { title: 'Una palabra', body: 'x', receivedAt });
    }

    it('al anotar un cumplimiento, recalcula last_fulfillment_at con el más reciente', async () => {
        const id = await crearProfecia();

        await addFulfillment(ownerId, id, { text: 'Primera parte', occurredAt: '2026-04-01' });
        expect((await findProphecy(ownerId, id))?.lastFulfillmentAt).toBe('2026-04-01');

        await addFulfillment(ownerId, id, { text: 'Segunda parte', occurredAt: '2026-05-10' });
        expect((await findProphecy(ownerId, id))?.lastFulfillmentAt).toBe('2026-05-10');
    });

    it('al editar la fecha de un cumplimiento, vuelve a recalcular', async () => {
        const id = await crearProfecia();
        const fulfillmentId = await addFulfillment(ownerId, id, {
            text: 'Parte',
            occurredAt: '2026-04-01',
        });
        await addFulfillment(ownerId, id, { text: 'Otra', occurredAt: '2026-04-15' });

        await updateFulfillment(ownerId, id, fulfillmentId, { occurredAt: '2026-06-01' });
        expect((await findProphecy(ownerId, id))?.lastFulfillmentAt).toBe('2026-06-01');
    });

    it('al borrar el último cumplimiento, vuelve al anterior; sin ninguno, a null', async () => {
        const id = await crearProfecia();
        const primero = await addFulfillment(ownerId, id, {
            text: 'Parte',
            occurredAt: '2026-04-01',
        });
        const segundo = await addFulfillment(ownerId, id, {
            text: 'Otra',
            occurredAt: '2026-05-01',
        });

        await deleteFulfillment(ownerId, id, segundo);
        expect((await findProphecy(ownerId, id))?.lastFulfillmentAt).toBe('2026-04-01');

        await deleteFulfillment(ownerId, id, primero);
        expect((await findProphecy(ownerId, id))?.lastFulfillmentAt).toBeNull();
    });

    it('D7: rechaza un cumplimiento anterior a la fecha en que se recibió', async () => {
        const id = await crearProfecia('2026-03-14');
        await expect(
            addFulfillment(ownerId, id, { text: 'Antes de tiempo', occurredAt: '2026-01-01' }),
        ).rejects.toThrow();
    });

    it('D1: no anota ni recalcula sobre una profecía de otro dueño', async () => {
        const id = await crearProfecia();
        await expect(
            addFulfillment(otroOwnerId, id, { text: 'Intrusa', occurredAt: '2026-04-01' }),
        ).rejects.toThrow();
    });

    it('los cumplimientos de la ficha salen del más reciente al más antiguo', async () => {
        const id = await crearProfecia();
        await addFulfillment(ownerId, id, { text: 'Primera', occurredAt: '2026-04-01' });
        await addFulfillment(ownerId, id, { text: 'Segunda', occurredAt: '2026-05-01' });

        const prophecy = await findProphecy(ownerId, id);
        expect(prophecy?.fulfillments.map((one) => one.text)).toEqual(['Segunda', 'Primera']);
    });
});
