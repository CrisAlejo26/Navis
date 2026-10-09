import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * El identificador de una fila con clave compuesta son dos UUID unidos con `:`
 * (73 caracteres) y `entity_id` admitía 64. SQLite no hace caso de la longitud
 * de un `varchar`; Postgres sí, y rechazaba la escritura de las listas.
 */
export class WidenSyncEntityId1791244800000 implements MigrationInterface {
    name = 'WidenSyncEntityId1791244800000';
    async up(queryRunner: QueryRunner): Promise<void> {
        if (queryRunner.connection.options.type !== 'postgres') return;
        await queryRunner.query(
            'ALTER TABLE sync_revisions ALTER COLUMN entity_id TYPE varchar(128)',
        );
        await queryRunner.query(
            'ALTER TABLE sync_changes ALTER COLUMN entity_id TYPE varchar(128)',
        );
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        if (queryRunner.connection.options.type !== 'postgres') return;
        await queryRunner.query('ALTER TABLE sync_changes ALTER COLUMN entity_id TYPE varchar(64)');
        await queryRunner.query(
            'ALTER TABLE sync_revisions ALTER COLUMN entity_id TYPE varchar(64)',
        );
    }
}
