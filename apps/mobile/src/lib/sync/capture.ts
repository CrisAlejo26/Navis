import type { LocalDb } from '@/data/local-db';

/**
 * Vincula (o desvincula) el registro de cambios locales a un destino. Con un
 * destino, los triggers de `sync_outbox` empiezan a apuntar cada escritura; sin
 * él, dejan de hacerlo. La cola ya escrita no se toca: sigue siendo de su
 * destino y nunca se envía a otro.
 */
export async function setCaptureDestination(
    db: LocalDb,
    destination: string | null,
): Promise<void> {
    await db.runAsync(
        'UPDATE sync_state SET destination = ?, capturing = ? WHERE id = 1',
        destination,
        destination === null ? 0 : 1,
    );
}

/** El destino al que está vinculado ahora mismo el registro, o `null`. */
export async function currentDestination(db: LocalDb): Promise<string | null> {
    const row = await db.getFirstAsync<{ destination: string | null }>(
        'SELECT destination FROM sync_state WHERE id = 1',
    );
    return row?.destination ?? null;
}

/**
 * Ejecuta `fn` con el registro apagado: lo que se escriba dentro (una descarga
 * del servidor, una restauración) no se apunta en la cola. Se enciende y se apaga
 * con la misma conexión que `fn`, así que va dentro de su transacción: si esta se
 * deshace, el interruptor también.
 */
export async function withoutCapture<T>(db: LocalDb, fn: () => Promise<T>): Promise<T> {
    await db.runAsync('UPDATE sync_state SET applying = 1 WHERE id = 1');
    try {
        return await fn();
    } finally {
        await db.runAsync('UPDATE sync_state SET applying = 0 WHERE id = 1');
    }
}

/** El destino de un vínculo: instalación y cuenta, para que dos cuentas no compartan cola. */
export const destinationOf = (link: { apiUrl: string; account: { id: string } }): string =>
    `${link.apiUrl}|${link.account.id}`;
