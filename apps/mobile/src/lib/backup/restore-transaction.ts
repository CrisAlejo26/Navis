import * as SecureStore from 'expo-secure-store';
import type { LocalDb } from '@/data/db';
import { inLocalTransaction } from '@/data/local-transaction';

/** El pepper debe acompañar a los hashes restaurados y volver atrás si falla SQLite. */
export async function restoreTransaction(
    db: LocalDb,
    pepper: string | undefined,
    restore: (transaction: LocalDb) => Promise<void>,
): Promise<void> {
    const key = 'navis.local.pepper';
    const previous = pepper ? await SecureStore.getItemAsync(key) : null;
    try {
        await inLocalTransaction(db, async (transaction) => {
            await restore(transaction);
            if (pepper) await SecureStore.setItemAsync(key, pepper);
        });
    } catch (error) {
        if (pepper) {
            if (previous) await SecureStore.setItemAsync(key, previous);
            else await SecureStore.deleteItemAsync(key);
        }
        throw error;
    }
}
