// Primero el soporte: registra los mocks de expo-crypto/expo-secure-store
// antes de que carguen los módulos que los usan.
import { setupLocalDb } from '@/data/test-support';
import { createAccount, countAccounts, findUser, login } from '@/data/repos/account-repo';
import { getDb, setDbForTests } from '@/data/db';
import { openDatabaseAsync } from 'expo-sqlite';

jest.mock('expo-sqlite', () => ({
    __esModule: true,
    openDatabaseAsync: jest.fn(),
}));

describe('la cuenta local', () => {
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

    it('se crea y se encuentra por su identificador', async () => {
        const result = await createAccount({
            name: 'Ana',
            email: 'Ana@Iglesia.es',
            password: 'MuySegura123',
        });
        if ('error' in result) throw new Error('la cuenta nueva no debería chocar');

        const user = await findUser(result.user.id);
        expect(user).toMatchObject({ name: 'Ana', email: 'ana@iglesia.es' });
        // El hash nunca es la contraseña.
        expect(user!.passwordHash).not.toContain('MuySegura123');
    });

    it('normaliza el correo a minúsculas y no admite duplicados', async () => {
        await createAccount({ name: 'Ana', email: 'ana@iglesia.es', password: 'MuySegura123' });

        const duplicate = await createAccount({
            name: 'Otra',
            email: 'ANA@IGLESIA.ES',
            password: 'MuySegura456',
        });
        expect('error' in duplicate && duplicate.error).toBe('email-taken');
        expect(await countAccounts()).toBe(1);
    });

    it('entra con la contraseña buena, pero no con una mala', async () => {
        await createAccount({ name: 'Ana', email: 'ana@iglesia.es', password: 'MuySegura123' });

        const good = await login({ email: 'ana@iglesia.es', password: 'MuySegura123' });
        expect('user' in good && good.user.name).toBe('Ana');

        const wrong = await login({ email: 'ana@iglesia.es', password: 'OtraClave123' });
        expect('error' in wrong && wrong.error).toBe('wrong-password');

        const missing = await login({ email: 'nadie@iglesia.es', password: 'MuySegura123' });
        expect('error' in missing && missing.error).toBe('no-account');
    });

    it('conserva la contraseña entre reinicios: el pepper sobrevive en SecureStore', async () => {
        await createAccount({ name: 'Ana', email: 'ana@iglesia.es', password: 'MuySegura123' });

        // Simula reiniciar la app: se vuelve a pedir la base (misma instancia en
        // memoria, como el fichero del teléfono) pero la sesión de módulos es nueva.
        setDbForTests(null);
        await getDb();

        const again = await login({ email: 'ana@iglesia.es', password: 'MuySegura123' });
        expect('error' in again).toBe(false);
    });
});
