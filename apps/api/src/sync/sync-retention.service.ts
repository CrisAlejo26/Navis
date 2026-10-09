import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, LessThan } from 'typeorm';

import { env } from '../config/env';
import { SyncChange } from './sync-change.entity';
import { SyncInstallation } from './sync-installation.entity';
import { SyncReceipt } from './sync-receipt.entity';

const DAY_MS = 86_400_000;

/**
 * Poda del registro. Borra los cambios ya publicados y los recibos más viejos
 * que `SYNC_RETENTION_DAYS` y anota hasta qué posición llegó (`pruned_through`):
 * un móvil con el cursor anterior recibe un 409 y rehace la descarga en lugar de
 * creerse al día con huecos. Las revisiones no se podan: son pequeñas y hacen
 * falta mientras exista la entidad.
 */
@Injectable()
export class SyncRetentionService implements OnModuleInit, OnModuleDestroy {
    private timer: NodeJS.Timeout | undefined;

    constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

    onModuleInit(): void {
        if (!env.SYNC_ENABLED) return;
        // Una vez al día; `unref` para que no mantenga vivo el proceso al cerrarse.
        this.timer = setInterval(() => void this.prune().catch(() => undefined), DAY_MS);
        this.timer.unref();
    }

    onModuleDestroy(): void {
        clearInterval(this.timer);
    }

    /** Devuelve cuántos cambios y recibos se borraron. */
    async prune(now: Date = new Date()): Promise<{ changes: number; receipts: number }> {
        const cutoff = new Date(now.getTime() - env.SYNC_RETENTION_DAYS * DAY_MS);
        return this.dataSource.transaction(async (manager) => {
            const old = await manager
                .getRepository(SyncChange)
                .createQueryBuilder('change')
                .select('MAX(change.position)', 'max')
                .where('change.position IS NOT NULL AND change.createdAt < :cutoff', { cutoff })
                .getRawOne<{ max: number | string | null }>();
            const through = Number(old?.max ?? 0);

            let changes = 0;
            if (through > 0) {
                // Todo lo publicado hasta esa posición: borrar solo lo viejo dejaría huecos con el cursor dentro.
                const result = await manager
                    .getRepository(SyncChange)
                    .createQueryBuilder()
                    .delete()
                    .where('position IS NOT NULL AND position <= :through', { through })
                    .execute();
                changes = result.affected ?? 0;
                const installation = manager.getRepository(SyncInstallation);
                const row = await installation.findOneByOrFail({ id: 'main' });
                await installation.update(
                    { id: 'main' },
                    { prunedThrough: Math.max(row.prunedThrough, through) },
                );
            }

            const receipts = await manager
                .getRepository(SyncReceipt)
                .delete({ createdAt: LessThan(cutoff) });
            return { changes, receipts: receipts.affected ?? 0 };
        });
    }
}
