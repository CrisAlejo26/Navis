import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Sincronización: hasta qué posición ha podado el registro (un cursor anterior
 * hay que rehacerlo). SQL directo y no `addColumn`: en SQLite TypeORM recrea la
 * tabla, y recrear una tabla con triggers colgando de ella los rompe.
 */
export class AddSyncRetentionFloor1791072000000 implements MigrationInterface {
    name = 'AddSyncRetentionFloor1791072000000';
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE sync_installation ADD COLUMN pruned_through integer NOT NULL DEFAULT 0',
        );
    }
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE sync_installation DROP COLUMN pruned_through');
    }
}
