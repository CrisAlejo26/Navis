// Verificación funcional de la siembra (Regla 11): corre `seedDemoData` contra
// la base local de verdad y comprueba que el listado, el resumen y las fichas
// devuelven lo sembrado. No es un test de unidad más: es el volcado que se
// mira para saber qué va a enseñar la pantalla.
import { setupLocalDb } from '@/data/test-support';
import { setDbForTests } from '@/data/db';
import { seedDemoData, hasDemoData } from '@/data/demo-data';
import { createAccount } from '@/data/repos/account-repo';
import { createChurch } from '@/data/repos/church-repo';
import { believersSummary, listBelievers, findBeliever } from '@/data/repos/believers-repo';
import { listGifts, listMinistries, listTags } from '@/data/repos/catalog-repo';
import { openDatabaseAsync } from 'expo-sqlite';

jest.mock('expo-sqlite', () => ({
    __esModule: true,
    openDatabaseAsync: jest.fn(),
}));

describe('los datos de prueba, sembrados de verdad', () => {
    let db: Awaited<ReturnType<typeof setupLocalDb>>;

    beforeAll(async () => {
        db = await setupLocalDb({ setDbForTests, openDatabaseMock: openDatabaseAsync });
    });

    afterAll(() => {
        db.close();
    });
    it('siembra veinte hermanos con notas, dones, labores y etiquetas', async () => {
        const account = await createAccount({
            name: 'Cristian',
            email: 'demo@navis.app',
            password: 'contrasena-larga-123',
        });
        if ('error' in account) throw new Error('no se pudo crear la cuenta de prueba');

        const church = await createChurch({
            name: 'Iglesia de la siembra',
            city: 'Elda',
            ownerId: account.user.id,
        });

        expect(await hasDemoData(church.id)).toBe(false);
        expect(await seedDemoData(church.id, account.user.id)).toBe(true);
        // Segunda vez: no duplica nada.
        expect(await seedDemoData(church.id, account.user.id)).toBe(false);
        expect(await hasDemoData(church.id)).toBe(true);

        const summary = await believersSummary(church.id);
        expect(summary.total).toBe(20);
        expect(summary.byStatus.activo).toBe(12);
        expect(summary.byStatus.nuevo).toBe(5);
        expect(summary.needsAttention).toBeGreaterThan(0);
        expect(summary.newThisMonth).toBeGreaterThan(0);

        // La página entera: sonda, etiquetas y labores por persona. Los
        // inactivos quedan fuera salvo que el filtro de estado los pida.
        const page = await listBelievers({ churchId: church.id, limit: 20 });
        expect(page.items).toHaveLength(18);
        const inactivos = await listBelievers({
            churchId: church.id,
            status: ['inactivo'],
            limit: 20,
        });
        expect(inactivos.items).toHaveLength(2);

        const conNotas = page.items.filter((one) => one.notesCount > 0);
        expect(conNotas.length).toBe(15);
        const desbordados = page.items.filter((one) => one.needsAttention);
        expect(desbordados.length).toBeGreaterThanOrEqual(2);
        const conEtiquetas = page.items.filter((one) => one.tags.length > 0);
        expect(conEtiquetas.length).toBe(9);

        // La ficha de Juan Carlos: labor de púlpito y etiqueta destacada.
        const juanCarlos = page.items.find((one) => one.firstName === 'Juan Carlos');
        expect(juanCarlos?.ministries).toContain('pulpito');
        expect(juanCarlos?.tags).toHaveLength(1);
        expect(juanCarlos?.featuredTagId).not.toBeNull();

        // La bitácora de María tiene notas de varios tipos.
        const maria = page.items.find((one) => one.firstName === 'María');
        const detail = await findBeliever(maria!.id, church.id);
        expect(detail?.notesCount).toBeGreaterThan(0);
        expect(detail?.phone).toBe('+34 600 333 444');

        // Los catálogos: siete dones de serie, diez labores y tres etiquetas.
        expect(await listGifts(church.id)).toHaveLength(7);
        expect(await listMinistries(church.id)).toHaveLength(10);
        expect(await listTags(church.id)).toHaveLength(3);
    });

    it('sembrar en una iglesia no se salta por tener creyentes en otra', async () => {
        const account = await createAccount({
            name: 'Cristian Dos',
            email: 'demo2@navis.app',
            password: 'contrasena-larga-123',
        });
        if ('error' in account) throw new Error('no se pudo crear la segunda cuenta');

        const llena = await createChurch({ name: 'Llena', city: 'Elda', ownerId: account.user.id });
        await seedDemoData(llena.id, account.user.id);

        const vacia = await createChurch({ name: 'Vacía', city: 'Elda', ownerId: account.user.id });
        // La comprobación es por iglesia: la vacía se siembra aunque la otra tenga veinte.
        expect(await seedDemoData(vacia.id, account.user.id)).toBe(true);
        expect((await believersSummary(vacia.id)).total).toBe(20);
    });
});
