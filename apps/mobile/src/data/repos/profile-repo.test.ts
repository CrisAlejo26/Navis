import { setupLocalDb } from '@/data/test-support';
import { createAccount } from '@/data/repos/account-repo';
import { setDbForTests } from '@/data/db';
import { createChurch, findChurch } from '@/data/repos/church-repo';
import { updateChurch } from '@/data/repos/church-update';
import { updateProfile } from '@/data/repos/profile-repo';
import { openDatabaseAsync } from 'expo-sqlite';

jest.mock('expo-sqlite', () => ({
    __esModule: true,
    openDatabaseAsync: jest.fn(),
}));

describe('ajustes: perfil e iglesia locales', () => {
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

    async function anOwner(): Promise<string> {
        const result = await createAccount({
            name: 'Dueño',
            email: 'dueño@iglesia.es',
            password: 'MuySegura123',
        });
        if ('error' in result) throw new Error('cuenta de prueba no creada');
        return result.user.id;
    }

    it('guarda el perfil y deja en blanco lo que llega vacío', async () => {
        const id = await anOwner();
        const saved = await updateProfile(id, {
            name: 'Ana Ruiz',
            phone: '600123123',
            city: 'Elda',
            bio: 'Pastora',
            timezone: 'America/Bogota',
        });
        expect(saved).toMatchObject({ name: 'Ana Ruiz', phone: '600123123', city: 'Elda' });
        expect(saved?.timezone).toBe('America/Bogota');

        const cleared = await updateProfile(id, { phone: '' });
        expect(cleared?.phone).toBeNull();
        expect(cleared?.city).toBe('Elda');
    });

    it('rechaza un nombre demasiado corto y una zona horaria vacía', async () => {
        const id = await anOwner();
        await expect(updateProfile(id, { name: 'A' })).rejects.toThrow();
        await expect(updateProfile(id, { timezone: '' })).rejects.toThrow();
    });

    it('edita la ficha de la iglesia sin tocar su slug', async () => {
        const ownerId = await anOwner();
        const church = await createChurch({ name: 'Iglesia del Sur', city: 'Elda', ownerId });

        const saved = await updateChurch(church.id, {
            name: 'Iglesia del Norte',
            country: 'CO',
            timezone: 'America/Bogota',
        });

        expect(saved).toMatchObject({ name: 'Iglesia del Norte', country: 'CO', city: 'Elda' });
        expect(saved?.slug).toBe('iglesia-del-sur');
        expect((await findChurch(church.id))?.timezone).toBe('America/Bogota');
    });

    it('rechaza un país que no es un código de dos letras', async () => {
        const ownerId = await anOwner();
        const church = await createChurch({ name: 'Iglesia', city: 'Elda', ownerId });
        await expect(updateChurch(church.id, { country: 'España' })).rejects.toThrow();
    });
});
