import { Table, TableIndex, type MigrationInterface, type QueryRunner } from 'typeorm';

/** Fase 7c: el cronómetro de las tareas. Sin clave foránea a `tasks` (ver la entidad). */
export class CreateTaskTimeEntries1790812800000 implements MigrationInterface {
    name = 'CreateTaskTimeEntries1790812800000';
    async up(queryRunner: QueryRunner): Promise<void> {
        const isPostgres = queryRunner.connection.options.type === 'postgres';
        const timestamp = isPostgres ? 'timestamptz' : 'datetime';
        const now = isPostgres ? 'now()' : 'CURRENT_TIMESTAMP';
        const uuid = isPostgres ? 'uuid' : 'varchar';
        await queryRunner.createTable(
            new Table({
                name: 'task_time_entries',
                columns: [
                    {
                        name: 'id',
                        type: uuid,
                        isPrimary: true,
                        default: isPostgres ? 'gen_random_uuid()' : undefined,
                    },
                    { name: 'created_at', type: timestamp, isNullable: false, default: now },
                    { name: 'updated_at', type: timestamp, isNullable: false, default: now },
                    { name: 'deleted_at', type: timestamp, isNullable: true },
                    { name: 'church_id', type: uuid, isNullable: false },
                    { name: 'owner_id', type: 'text', isNullable: false },
                    { name: 'task_id', type: uuid, isNullable: false },
                    { name: 'started_at', type: timestamp, isNullable: false },
                    { name: 'ended_at', type: timestamp, isNullable: true },
                ],
            }),
            true,
        );
        await queryRunner.createIndex(
            'task_time_entries',
            new TableIndex({ name: 'IDX_task_time_church_id', columnNames: ['church_id'] }),
        );
        await queryRunner.createIndex(
            'task_time_entries',
            new TableIndex({ name: 'IDX_task_time_task_id', columnNames: ['task_id'] }),
        );
        await queryRunner.createIndex(
            'task_time_entries',
            new TableIndex({
                name: 'IDX_task_time_church_owner_started',
                columnNames: ['church_id', 'owner_id', 'started_at'],
            }),
        );
    }
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('task_time_entries', true);
    }
}
