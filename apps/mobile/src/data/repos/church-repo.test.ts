// Primero el soporte: registra los mocks de expo-crypto/expo-secure-store
// antes de que carguen los módulos que los usan.
import { setupLocalDb } from '@/data/test-support';
import { createAccount } from '@/data/repos/account-repo';
import { setDbForTests } from '@/data/db';
import { createChurch, findChurch, findChurchByOwner } from '@/data/repos/church-repo';
import { openDatabaseAsync } from 'expo-sqlite';

jest.mock('expo-sqlite', () => ({
    __esModule: true,
    openDatabaseAsync: jest.fn(),
}));

describe('la iglesia local', () => {
    let db: Awaited<ReturnType<typeof setupLocalDb>>;

    beforeAll(async () => {
        db = await setupLocalDb({ setDbForTests, openDatabaseMock: openDatabaseAsync });
    });

    beforeEach(async () => {
        await db.clear();
    });

    afterAll(() => {
        db.close();
    });

    async function anOwner(email: string): Promise<string> {
        const result = await createAccount({ name: 'Dueño', email, password: 'MuySegura123' });
        if ('error' in result) throw new Error('cuenta de prueba no creada');
        return result.user.id;
    }

    it('se crea con su slug y su sede por defecto', async () => {
        const ownerId = await anOwner('dueño@iglesia.es');
        const church = await createChurch({ name: 'Iglesia del Sur', city: 'Elda', ownerId });

        expect(church.slug).toBe('iglesia-del-sur');

        // La zona es la del dispositivo, no una fija: en CI el runner está en UTC.
        const deviceTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        const stored = await findChurch(church.id);
        expect(stored).toMatchObject({
            name: 'Iglesia del Sur',
            city: 'Elda',
            timezone: deviceTimezone,
            ownerId,
        });

        const congregations = await db.adapter.getAllAsync(
            'SELECT name, is_default, is_active FROM congregations WHERE church_id = ?',
            church.id,
        );
        expect(congregations).toHaveLength(1);
        expect(congregations[0]).toMatchObject({ is_default: 1, is_active: 1 });
    });

    it('no repite el slug: la segunda iglesia con el mismo nombre lleva sufijo', async () => {
        const ownerId = await anOwner('dueño2@iglesia.es');
        const first = await createChurch({ name: 'Iglesia del Sur', city: 'Elda', ownerId });
        const second = await createChurch({ name: 'Iglesia del Sur', city: 'Elda', ownerId });

        expect(first.slug).toBe('iglesia-del-sur');
        expect(second.slug).toBe('iglesia-del-sur-2');
    });

    it('la encuentra por su dueño, que es como entra el login', async () => {
        const ownerId = await anOwner('dueño3@iglesia.es');
        await createChurch({ name: 'Iglesia del Sur', city: 'Elda', ownerId });

        expect((await findChurchByOwner(ownerId))?.name).toBe('Iglesia del Sur');
        expect(await findChurchByOwner('nadie')).toBeNull();
    });
});
