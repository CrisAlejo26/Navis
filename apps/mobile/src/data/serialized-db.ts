import type { LocalDb } from './local-db';
import type { SQLiteRunResult, SQLiteVariadicBindParams } from 'expo-sqlite';
import { isolatedTransaction } from './local-transaction';

/** Serializa consultas; las transacciones aisladas reciben su propia interfaz directa. */
export function serialize(db: LocalDb): LocalDb {
    let tail: Promise<unknown> = Promise.resolve();
    let inTransaction = false;

    const enqueue = <T>(op: () => Promise<T>): Promise<T> => {
        if (inTransaction) return op();
        const run = tail.then(op, op);
        tail = run.catch(() => undefined);
        return run;
    };

    return {
        withIsolatedTransactionAsync(fn): Promise<void> {
            const run = tail.then(
                () => isolatedTransaction(db, fn),
                () => isolatedTransaction(db, fn),
            );
            tail = run.catch(() => undefined);
            return run;
        },
        async getAllAsync<T>(source: string, ...params: SQLiteVariadicBindParams): Promise<T[]> {
            return enqueue(() => db.getAllAsync<T>(source, ...params));
        },
        async getFirstAsync<T>(
            source: string,
            ...params: SQLiteVariadicBindParams
        ): Promise<T | null> {
            return enqueue(() => db.getFirstAsync<T>(source, ...params));
        },
        async runAsync(
            source: string,
            ...params: SQLiteVariadicBindParams
        ): Promise<SQLiteRunResult> {
            return enqueue(() => db.runAsync(source, ...params));
        },
        async execAsync(source: string): Promise<void> {
            return enqueue(() => db.execAsync(source));
        },
        withTransactionAsync(fn: () => Promise<void>): Promise<void> {
            if (inTransaction) return fn();
            return enqueue(async () => {
                inTransaction = true;
                try {
                    await db.execAsync('BEGIN');
                    try {
                        await fn();
                        await db.execAsync('COMMIT');
                    } catch (error) {
                        await db.execAsync('ROLLBACK');
                        throw error;
                    }
                } finally {
                    inTransaction = false;
                }
            });
        },
    };
}
