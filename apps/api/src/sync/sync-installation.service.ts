import { Injectable, type OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { env } from '../config/env';
import { SyncInstallation } from './sync-installation.entity';

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
    ) {}

    async onModuleInit(): Promise<void> {
        const row = await this.installation.findOneBy({ id: MAIN });
        if (!row) return; // la migración todavía no se ha ejecutado
        if (row.capturing === env.SYNC_ENABLED) return;

        // Cualquier cambio de estado abre una laguna en el registro: nueva generación.
        await this.installation.update(
            { id: MAIN },
            { capturing: env.SYNC_ENABLED, generation: crypto.randomUUID() },
        );
    }

    async generation(): Promise<string> {
        const row = await this.installation.findOneByOrFail({ id: MAIN });
        return row.generation;
    }
}
