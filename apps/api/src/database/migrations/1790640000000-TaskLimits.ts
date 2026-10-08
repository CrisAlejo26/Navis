import { TableColumn, type MigrationInterface, type QueryRunner } from 'typeorm';

/**
 * Fase 7a: «vence el» y tiempo máximo en curso. `timestamp` en Postgres y
 * `datetime` en SQLite, igual que `completed_at`.
 */
export class TaskLimits1790640000000 implements MigrationInterface {
    name = 'TaskLimits1790640000000';
    async up(queryRunner: QueryRunner): Promise<void> {
        const driver = queryRunner.connection.options.type;
        const instant = driver === 'postgres' ? 'timestamptz' : 'datetime';
        await queryRunner.addColumn(
            'tasks',
            new TableColumn({ name: 'due_date', type: 'date', isNullable: true }),
        );
        await queryRunner.addColumn(
            'tasks',
            new TableColumn({ name: 'in_progress_deadline', type: instant, isNullable: true }),
        );
    }
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('tasks', 'in_progress_deadline');
        await queryRunner.dropColumn('tasks', 'due_date');
    }
}
