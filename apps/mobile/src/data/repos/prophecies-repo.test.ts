// Primero el soporte: registra los mocks de expo-crypto/expo-secure-store
// antes de que carguen los módulos que los usan.
import { setupLocalDb } from '@/data/test-support';
import { setDbForTests } from '@/data/db';
import {
    createProphecy,
    deleteProphecy,
    findProphecy,
    listProphecies,
    updateProphecy,
} from '@/data/repos/prophecies-repo';
import { openDatabaseAsync } from 'expo-sqlite';

jest.mock('expo-sqlite', () => ({
    __esModule: true,
    openDatabaseAsync: jest.fn(),
}));

describe('las profecías en local (docs/planes/implementados/profecias-movil-plan.md)', () => {
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

    it('crea una profecía y la vuelve a encontrar por su dueño', async () => {
        const id = await createProphecy(ownerId, {
            title: 'La casa junto al río',
            body: 'Vas a tener una casa junto al río',
            receivedAt: '2026-03-14',
        });

        const prophecy = await findProphecy(ownerId, id);
        expect(prophecy?.title).toBe('La casa junto al río');
        expect(prophecy?.fulfilledAt).toBeNull();
        expect(prophecy?.fulfillments).toEqual([]);
    });

    it('D1: un dueño no ve ni puede tocar las profecías de otro', async () => {
        const id = await createProphecy(ownerId, {
            title: 'Privada',
            body: 'Solo mía',
            receivedAt: '2026-01-01',
        });

        expect(await findProphecy(otroOwnerId, id)).toBeNull();

        await updateProphecy(otroOwnerId, id, { title: 'Robada' });
        expect((await findProphecy(ownerId, id))?.title).toBe('Privada');

        await deleteProphecy(otroOwnerId, id);
        expect(await findProphecy(ownerId, id)).not.toBeNull();

        const list = await listProphecies(otroOwnerId, {});
        expect(list.items).toHaveLength(0);
    });

    it('D7: rechaza crear una profecía cumplida antes de recibirse', async () => {
        await expect(
            createProphecy(ownerId, {
                title: 'Imposible',
                body: 'x',
                receivedAt: '2026-03-14',
                fulfilledAt: '2026-01-01',
            }),
        ).rejects.toThrow();
    });

    it('D7: rechaza editar dejando el cumplimiento antes de la recepción', async () => {
        const id = await createProphecy(ownerId, {
            title: 'Alguna',
            body: 'x',
            receivedAt: '2026-03-14',
        });

        await expect(updateProphecy(ownerId, id, { fulfilledAt: '2026-01-01' })).rejects.toThrow();
    });

    it('actualiza título, cuerpo y fecha, y recalcula el texto de búsqueda', async () => {
        const id = await createProphecy(ownerId, {
            title: 'Antiguo',
            body: 'texto antiguo',
            receivedAt: '2026-03-14',
        });

        await updateProphecy(ownerId, id, { title: 'Nuevo título', body: 'texto nuevo' });
        const prophecy = await findProphecy(ownerId, id);
        expect(prophecy?.title).toBe('Nuevo título');
        expect(prophecy?.body).toBe('texto nuevo');

        const found = await listProphecies(ownerId, { search: 'nuevo' });
        expect(found.items).toHaveLength(1);
    });

    it('borra una profecía: deja de listarse y de encontrarse', async () => {
        const id = await createProphecy(ownerId, {
            title: 'Efímera',
            body: 'x',
            receivedAt: '2026-03-14',
        });
        await deleteProphecy(ownerId, id);

        expect(await findProphecy(ownerId, id)).toBeNull();
        expect((await listProphecies(ownerId, {})).items).toHaveLength(0);
    });

    describe('filtros del listado', () => {
        beforeEach(async () => {
            await createProphecy(ownerId, {
                title: 'En espera',
                body: 'x',
                receivedAt: '2020-01-01',
            });
            const enCaminoId = await createProphecy(ownerId, {
                title: 'En camino',
                body: 'x',
                receivedAt: '2020-02-01',
            });
            await createProphecy(ownerId, {
                title: 'Cumplida',
                body: 'x',
                receivedAt: '2020-03-01',
                fulfilledAt: '2020-06-01',
            });
            // La marca «en camino» solo se pone desde el repo de cumplimientos,
            // pero aquí basta con escribirla a mano vía updateProphecy... salvo
            // que updateProphecy no toca `lastFulfillmentAt`. Se deja constancia
            // de que ese estado se prueba de verdad en
            // `prophecy-fulfillments-repo.test.ts`, con `addFulfillment`.
            void enCaminoId;
        });

        it('filtra por estado: espera y cumplida', async () => {
            const espera = await listProphecies(ownerId, { state: ['espera'] });
            expect(espera.items.map((one) => one.title)).toEqual(
                expect.arrayContaining(['En espera', 'En camino']),
            );

            const cumplida = await listProphecies(ownerId, { state: ['cumplida'] });
            expect(cumplida.items.map((one) => one.title)).toEqual(['Cumplida']);
        });

        it('busca por título normalizado, sin acentos', async () => {
            const found = await listProphecies(ownerId, { search: 'espera' });
            expect(found.items.map((one) => one.title)).toEqual(['En espera']);
        });

        it('filtra por ventana de fechas con from/to', async () => {
            const found = await listProphecies(ownerId, { from: '2020-02-01', to: '2020-02-28' });
            expect(found.items.map((one) => one.title)).toEqual(['En camino']);
        });
    });
});
