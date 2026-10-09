import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { isUniqueViolation } from '../database/unique-violation';
import { SyncChange } from './sync-change.entity';

const BATCH = 500;

/**
 * Reparte las posiciones del registro. Corre **serializado** (una cadena de
 * promesas por proceso y el índice único de `position` entre procesos) y solo ve
 * filas ya confirmadas, así que una posición nunca se asigna antes de que su
 * transacción termine: un consumidor con el cursor en N no puede perderse un
 * cambio que se confirme después, porque ese recibirá una posición mayor.
 */
@Injectable()
export class SyncPublisher {
    private queue: Promise<void> = Promise.resolve();

    constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

    /** Publica todo lo pendiente; las llamadas simultáneas se ejecutan una detrás de otra. */
    publish(): Promise<void> {
        const run = this.queue.then(() => this.drain());
        this.queue = run.catch(() => undefined);
        return run;
    }

    private async drain(): Promise<void> {
        for (;;) {
            try {
                const published = await this.publishBatch();
                if (published < BATCH) return;
            } catch (error) {
                // Otro proceso publicó a la vez y ganó la posición: se reintenta con lo que quede.
                if (!isUniqueViolation(error)) throw error;
            }
        }
    }

    private publishBatch(): Promise<number> {
        return this.dataSource.transaction(async (manager) => {
            const repo = manager.getRepository(SyncChange);
            const pending = await repo
                .createQueryBuilder('change')
                .where('change.position IS NULL')
                .orderBy('change.createdAt', 'ASC')
                .addOrderBy('change.revision', 'ASC')
                .addOrderBy('change.id', 'ASC')
                .limit(BATCH)
                .getMany();
            if (pending.length === 0) return 0;

            const top = await repo
                .createQueryBuilder('change')
                .select('MAX(change.position)', 'max')
                .getRawOne<{ max: number | string | null }>();
            let next = Number(top?.max ?? 0);
            for (const change of pending) {
                next += 1;
                await repo.update({ id: change.id }, { position: next });
            }
            return pending.length;
        });
    }
}
