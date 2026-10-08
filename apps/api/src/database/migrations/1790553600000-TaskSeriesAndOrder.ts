import { TableColumn, type MigrationInterface, type QueryRunner } from 'typeorm';

export class TaskSeriesAndOrder1790553600000 implements MigrationInterface {
    name = 'TaskSeriesAndOrder1790553600000';
    async up(queryRunner: QueryRunner): Promise<void> {
        for (const [name, type] of [
            ['repeat_options', 'text'],
            ['repeat_pauses', 'text'],
            ['repeat_stopped_at', 'date'],
            ['manual_order', 'int'],
        ]) {
            await queryRunner.addColumn('tasks', new TableColumn({ name, type, isNullable: true }));
        }
    }
    async down(queryRunner: QueryRunner): Promise<void> {
        for (const name of ['manual_order', 'repeat_stopped_at', 'repeat_pauses', 'repeat_options'])
            await queryRunner.dropColumn('tasks', name);
    }
}
