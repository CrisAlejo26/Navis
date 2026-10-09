import { randomUUID } from 'node:crypto';
import { Table, TableIndex, type MigrationInterface, type QueryRunner } from 'typeorm';

import { triggerStatements } from '@navis/shared';

/**
 * Sincronización, Fase 4: registro de cambios, revisiones, recibos y los
 * triggers que los alimentan. Los triggers se generan a partir de
 * `SYNC_COVERAGE`, así que esta migración no está congelada (CLAUDE.md): si
 * una tabla nueva entra en la matriz, su migración vuelve a instalar los
 * triggers —`triggerStatements` es idempotente— y `sync-triggers.test.ts` falla
 * si se olvida.
 */
export class CreateSyncLog1790985600000 implements MigrationInterface {
    name = 'CreateSyncLog1790985600000';
    async up(queryRunner: QueryRunner): Promise<void> {
        const isPostgres = queryRunner.connection.options.type === 'postgres';
        const timestamp = isPostgres ? 'timestamptz' : 'datetime';
        const uuid = isPostgres ? 'uuid' : 'varchar';
        const generateUuid = isPostgres ? 'gen_random_uuid()' : undefined;

        await queryRunner.createTable(
            new Table({
                name: 'sync_installation',
                columns: [
                    { name: 'id', type: 'varchar', length: '16', isPrimary: true },
                    { name: 'generation', type: 'varchar', length: '64', isNullable: false },
                    { name: 'capturing', type: 'boolean', isNullable: false, default: false },
                ],
            }),
            true,
        );
        await queryRunner.query(
            `INSERT INTO sync_installation (id, generation, capturing) VALUES ('main', '${randomUUID()}', ${isPostgres ? 'false' : '0'})`,
        );

        await queryRunner.createTable(
            new Table({
                name: 'sync_revisions',
                columns: [
                    { name: 'table_name', type: 'varchar', length: '64', isPrimary: true },
                    { name: 'entity_id', type: 'varchar', length: '64', isPrimary: true },
                    { name: 'revision', type: 'integer', isNullable: false },
                ],
            }),
            true,
        );

        await queryRunner.createTable(
            new Table({
                name: 'sync_changes',
                columns: [
                    { name: 'id', type: uuid, isPrimary: true, default: generateUuid },
                    { name: 'position', type: 'integer', isNullable: true },
                    { name: 'table_name', type: 'varchar', length: '64', isNullable: false },
                    { name: 'entity_id', type: 'varchar', length: '64', isNullable: false },
                    { name: 'op', type: 'varchar', length: '10', isNullable: false },
                    { name: 'revision', type: 'integer', isNullable: false },
                    { name: 'church_id', type: uuid, isNullable: true },
                    { name: 'owner_id', type: 'text', isNullable: true },
                    { name: 'created_at', type: timestamp, isNullable: false },
                ],
            }),
            true,
        );
        await queryRunner.createIndex(
            'sync_changes',
            new TableIndex({
                name: 'UQ_sync_changes_position',
                columnNames: ['position'],
                isUnique: true,
            }),
        );
        await queryRunner.createIndex(
            'sync_changes',
            new TableIndex({ name: 'IDX_sync_changes_church_id', columnNames: ['church_id'] }),
        );
        await queryRunner.createIndex(
            'sync_changes',
            new TableIndex({ name: 'IDX_sync_changes_created_at', columnNames: ['created_at'] }),
        );

        await queryRunner.createTable(
            new Table({
                name: 'sync_receipts',
                columns: [
                    { name: 'id', type: uuid, isPrimary: true, default: generateUuid },
                    { name: 'device_id', type: 'varchar', length: '64', isNullable: false },
                    { name: 'operation_id', type: 'varchar', length: '64', isNullable: false },
                    { name: 'request_hash', type: 'varchar', length: '64', isNullable: false },
                    { name: 'result', type: 'text', isNullable: false },
                    { name: 'created_at', type: timestamp, isNullable: false },
                ],
            }),
            true,
        );
        await queryRunner.createIndex(
            'sync_receipts',
            new TableIndex({
                name: 'UQ_sync_receipts_device_operation',
                columnNames: ['device_id', 'operation_id'],
                isUnique: true,
            }),
        );

        for (const statement of triggerStatements(isPostgres ? 'postgres' : 'sqlite')) {
            await queryRunner.query(statement);
        }
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        const isPostgres = queryRunner.connection.options.type === 'postgres';
        const drops = triggerStatements(isPostgres ? 'postgres' : 'sqlite').filter((statement) =>
            statement.startsWith('DROP TRIGGER'),
        );
        for (const statement of drops) await queryRunner.query(statement);
        if (isPostgres) {
            // Las funciones de Postgres sobreviven al DROP TRIGGER: se borran por su nombre.
            const found: unknown = await queryRunner.query(
                `SELECT proname FROM pg_proc WHERE proname LIKE 'sync_capture_%'`,
            );
            const names = Array.isArray(found)
                ? (found as unknown[]).flatMap((row) =>
                      typeof row === 'object' && row !== null && 'proname' in row
                          ? [String(row.proname)]
                          : [],
                  )
                : [];
            for (const name of names) {
                await queryRunner.query(`DROP FUNCTION IF EXISTS ${name}()`);
            }
        }
        for (const table of [
            'sync_receipts',
            'sync_changes',
            'sync_revisions',
            'sync_installation',
        ]) {
            await queryRunner.dropTable(table, true);
        }
    }
}
