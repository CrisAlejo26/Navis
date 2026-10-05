import type { LocalDb } from './local-db';

/** Usa la conexión directa solo dentro de la transacción; los demás lectores esperan en la cola. */
export async function isolatedTransaction(
    db: LocalDb,
    operation: (transaction: LocalDb) => Promise<void>,
): Promise<void> {
    const transaction: LocalDb = {
        getAllAsync: (sql, ...params) => db.getAllAsync(sql, ...params),
        getFirstAsync: (sql, ...params) => db.getFirstAsync(sql, ...params),
        runAsync: (sql, ...params) => db.runAsync(sql, ...params),
        execAsync: (sql) => db.execAsync(sql),
        withTransactionAsync: (nested) => nested(),
        withIsolatedTransactionAsync: (nested) => nested(transaction),
    };
    await db.execAsync('BEGIN');
    try {
        await operation(transaction);
        await db.execAsync('COMMIT');
    } catch (error) {
        await db.execAsync('ROLLBACK');
        throw error;
    }
}

export function inLocalTransaction(
    db: LocalDb,
    operation: (transaction: LocalDb) => Promise<void>,
): Promise<void> {
    return db.withIsolatedTransactionAsync
        ? db.withIsolatedTransactionAsync(operation)
        : db.withTransactionAsync(() => operation(db));
}
