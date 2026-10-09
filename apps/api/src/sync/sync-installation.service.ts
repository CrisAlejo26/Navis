import { Injectable, type OnModuleInit } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { env } from '../config/env';
import { SyncInstallation } from './sync-installation.entity';
import { repairTriggers } from './sync-triggers-health';

const MAIN = 'main';

/**
 * La identidad de esta instalación y el interruptor de captura. Al arrancar
 * alinea `capturing` con `SYNC_ENABLED`: encendido, los triggers empiezan a
 * registrar; apagado, dejan de escribir. Lo anterior a encenderlo no está en el
 * registro —lo cubre un bootstrap (Fase 7)—, y por eso apagar y volver a
 * encender también exige uno: `generation` cambia al reanudar.
 */
@Injectable()
export class SyncInstallationService implements OnModuleInit {
    constructor(
        @InjectRepository(SyncInstallation)
        private readonly installation: Repository<SyncInstallation>,
        @InjectDataSource() private readonly dataSource: DataSource,
    ) {}

    async onModuleInit(): Promise<void> {
        const row = await this.installation.findOneBy({ id: MAIN });
        if (!row) return; // la migración todavía no se ha ejecutado
        // Una migración que recree una tabla se lleva sus triggers por delante: se reponen.
        if (env.SYNC_ENABLED) await repairTriggers(this.dataSource);
        if (row.capturing === env.SYNC_ENABLED) return;

        // Cualquier cambio de estado abre una laguna en el registro: nueva generación.
        await this.installation.update(
            { id: MAIN },
            { capturing: env.SYNC_ENABLED, generation: crypto.randomUUID() },
        );
    }

    async state(): Promise<{ generation: string; prunedThrough: number }> {
        const row = await this.installation.findOneByOrFail({ id: MAIN });
        return { generation: row.generation, prunedThrough: row.prunedThrough };
    }
}
