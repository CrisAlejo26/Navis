import type { LocalDb } from '@/data/local-db';
import { inLocalTransaction } from '@/data/local-transaction';

import { applyChange } from './apply-change';
import { withoutCapture } from './capture';
import type { SyncApi } from './sync-api';

const PAGE = 200;

export interface PullReport {
    applied: number;
    deferred: number;
    failed: number;
    pages: number;
}

async function checkpoint(
    db: LocalDb,
    destination: string,
): Promise<{ cursor: number; generation: string | null }> {
    const row = await db.getFirstAsync<{ cursor: number; generation: string | null }>(
        'SELECT cursor, generation FROM sync_checkpoint WHERE destination = ?',
        destination,
    );
    return row ?? { cursor: 0, generation: null };
}

/**
 * Descarga el registro de cambios por páginas. Cada página se aplica y su cursor
 * se guarda **en la misma transacción**: si la app se cierra a mitad, o se
 * aplicó la página entera con su cursor o no se aplicó nada, y la siguiente
 * vuelta pide desde donde tocaba. Un 409 (otra instalación, cursor del futuro o
 * más viejo que la poda) lo lanza `api.changes` y lo trata el coordinador.
 */
export async function pullChanges(
    db: LocalDb,
    api: SyncApi,
    destination: string,
    now: () => string,
): Promise<PullReport> {
    const report: PullReport = { applied: 0, deferred: 0, failed: 0, pages: 0 };
    let { cursor, generation } = await checkpoint(db, destination);

    for (;;) {
        const page = await api.changes({
            cursor,
            limit: PAGE,
            generation: generation ?? undefined,
        });

        await inLocalTransaction(db, async (tx) => {
            await withoutCapture(tx, async () => {
                for (const change of page.changes) {
                    const outcome = await applyChange(tx, destination, change, now());
                    if (outcome.kind === 'applied') report.applied += 1;
                    else if (outcome.kind === 'deferred') report.deferred += 1;
                    else if (outcome.kind === 'failed') report.failed += 1;
                }
                await tx.runAsync(
                    `INSERT INTO sync_checkpoint (destination, generation, cursor) VALUES (?, ?, ?)
                     ON CONFLICT (destination) DO UPDATE SET generation = excluded.generation, cursor = excluded.cursor`,
                    destination,
                    page.generation,
                    page.nextCursor,
                );
            });
        });

        report.pages += 1;
        cursor = page.nextCursor;
        generation = page.generation;
        if (!page.hasMore) return report;
    }
}
