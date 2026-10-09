import { triggerStatements } from '@navis/shared';
import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Sincronización: reinstala los triggers del registro de cambios. La primera
 * versión asumía que toda tabla tenía `id` y `deleted_at`, y no es así
 * (`list_members` y `list_grants` tienen clave compuesta; seis tablas no tienen
 * borrado lógico). Es idempotente (`DROP … IF EXISTS` + `CREATE`) y no está
 * congelada a propósito: instala lo que declara `@navis/shared` hoy.
 */
export class ReinstallSyncTriggers1791158400000 implements MigrationInterface {
    name = 'ReinstallSyncTriggers1791158400000';
    async up(queryRunner: QueryRunner): Promise<void> {
        const driver = queryRunner.connection.options.type === 'postgres' ? 'postgres' : 'sqlite';
        for (const statement of triggerStatements(driver)) {
            await queryRunner.query(statement);
        }
    }

    down(): Promise<void> {
        // Los triggers los quita la migración que los creó.
        return Promise.resolve();
    }
}
