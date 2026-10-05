import * as SecureStore from 'expo-secure-store';
import { restoreTransaction } from './restore-transaction';
jest.mock('expo-secure-store', () => {
    const values = new Map<string, string>();
    return {
        getItemAsync: (key: string) => Promise.resolve(values.get(key) ?? null),
        setItemAsync: (key: string, value: string) => Promise.resolve(void values.set(key, value)),
        deleteItemAsync: (key: string) => Promise.resolve(void values.delete(key)),
    };
});

it('recupera el pepper anterior si SQLite rechaza el commit después de importar el nuevo', async () => {
    await SecureStore.setItemAsync('navis.local.pepper', 'previous');
    const db = {
        getAllAsync: <T>() => Promise.resolve<T[]>([]),
        getFirstAsync: <T>() => Promise.resolve<T | null>(null),
        runAsync: () => Promise.resolve({ changes: 0, lastInsertRowId: 0 }),
        execAsync: () => Promise.resolve(),
        withTransactionAsync: async (restore: () => Promise<void>) => {
            await restore();
            expect(await SecureStore.getItemAsync('navis.local.pepper')).toBe('imported');
            throw new Error('commit-failed');
        },
    };
    await expect(restoreTransaction(db, 'imported', () => Promise.resolve())).rejects.toThrow(
        'commit-failed',
    );
    expect(await SecureStore.getItemAsync('navis.local.pepper')).toBe('previous');
});
