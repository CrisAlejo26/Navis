import { Table, TableColumn, TableIndex, type MigrationInterface, type QueryRunner } from 'typeorm';

/** Fase 7b: la tabla `workflows` y `tasks.workflow_id` (nulo, sin clave foránea: ver la entidad). */
export class CreateWorkflows1790726400000 implements MigrationInterface {
    name = 'CreateWorkflows1790726400000';
    async up(queryRunner: QueryRunner): Promise<void> {
        const isPostgres = queryRunner.connection.options.type === 'postgres';
        const timestamp = isPostgres ? 'timestamptz' : 'datetime';
        const now = isPostgres ? 'now()' : 'CURRENT_TIMESTAMP';
        const uuid = isPostgres ? 'uuid' : 'varchar';
        await queryRunner.createTable(
            new Table({
                name: 'workflows',
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
                    { name: 'name', type: 'text', isNullable: false },
                    { name: 'description', type: 'text', isNullable: true },
                    { name: 'accent', type: 'text', isNullable: false },
                    { name: 'position', type: 'int', isNullable: false, default: 0 },
                ],
            }),
            true,
        );
        await queryRunner.createIndex(
            'workflows',
            new TableIndex({ name: 'IDX_workflows_church_id', columnNames: ['church_id'] }),
        );
        await queryRunner.createIndex(
            'workflows',
            new TableIndex({
                name: 'UQ_workflows_church_owner_name',
                columnNames: ['church_id', 'owner_id', 'name'],
                isUnique: true,
            }),
        );
        await queryRunner.addColumn(
            'tasks',
            new TableColumn({ name: 'workflow_id', type: uuid, isNullable: true }),
        );
    }
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('tasks', 'workflow_id');
        await queryRunner.dropTable('workflows', true);
    }
}
