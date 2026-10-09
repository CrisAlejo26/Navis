import { Table, TableIndex, type MigrationInterface, type QueryRunner } from 'typeorm';

/** Sincronización, Fase 1: tokens de vinculación y dispositivos vinculados. Solo guardan huellas. */
export class CreateDevices1790899200000 implements MigrationInterface {
    name = 'CreateDevices1790899200000';
    async up(queryRunner: QueryRunner): Promise<void> {
        const isPostgres = queryRunner.connection.options.type === 'postgres';
        const timestamp = isPostgres ? 'timestamptz' : 'datetime';
        const now = isPostgres ? 'now()' : 'CURRENT_TIMESTAMP';
        const uuid = isPostgres ? 'uuid' : 'varchar';
        const base = [
            {
                name: 'id',
                type: uuid,
                isPrimary: true,
                default: isPostgres ? 'gen_random_uuid()' : undefined,
            },
            { name: 'created_at', type: timestamp, isNullable: false, default: now },
            { name: 'updated_at', type: timestamp, isNullable: false, default: now },
            { name: 'deleted_at', type: timestamp, isNullable: true },
            { name: 'user_id', type: 'text', isNullable: false },
        ];

        await queryRunner.createTable(
            new Table({
                name: 'device_links',
                columns: [
                    ...base,
                    { name: 'token_hash', type: 'varchar', length: '64', isNullable: false },
                    { name: 'expires_at', type: timestamp, isNullable: false },
                    { name: 'consumed_at', type: timestamp, isNullable: true },
                ],
            }),
            true,
        );
        await queryRunner.createIndex(
            'device_links',
            new TableIndex({ name: 'IDX_device_links_user_id', columnNames: ['user_id'] }),
        );
        await queryRunner.createIndex(
            'device_links',
            new TableIndex({
                name: 'UQ_device_links_token_hash',
                columnNames: ['token_hash'],
                isUnique: true,
            }),
        );

        await queryRunner.createTable(
            new Table({
                name: 'devices',
                columns: [
                    ...base,
                    { name: 'name', type: 'varchar', length: '80', isNullable: false },
                    { name: 'credential_hash', type: 'varchar', length: '64', isNullable: false },
                    { name: 'last_seen_at', type: timestamp, isNullable: true },
                    { name: 'revoked_at', type: timestamp, isNullable: true },
                ],
            }),
            true,
        );
        await queryRunner.createIndex(
            'devices',
            new TableIndex({ name: 'IDX_devices_user_id', columnNames: ['user_id'] }),
        );
        await queryRunner.createIndex(
            'devices',
            new TableIndex({
                name: 'UQ_devices_credential_hash',
                columnNames: ['credential_hash'],
                isUnique: true,
            }),
        );
    }
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('devices', true);
        await queryRunner.dropTable('device_links', true);
    }
}
