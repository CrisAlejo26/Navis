import { Table, TableIndex, type MigrationInterface, type QueryRunner } from 'typeorm';

/** La racha más larga de cada cuenta, por iglesia (RFC 0018 §5.6, D9). */
export class CreateTaskStreakCache1788912000000 implements MigrationInterface {
  name = 'CreateTaskStreakCache1788912000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';
    const uuid = isPostgres ? 'uuid' : 'varchar';
    const timestamp = isPostgres ? 'timestamptz' : 'datetime';
    const now = isPostgres ? 'now()' : 'CURRENT_TIMESTAMP';

    await queryRunner.createTable(
      new Table({
        name: 'task_streak_cache',
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
          { name: 'longest_streak', type: 'int', isNullable: false, default: 0 },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'task_streak_cache',
      new TableIndex({
        name: 'UQ_task_streak_cache',
        columnNames: ['church_id', 'owner_id'],
        isUnique: true,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('task_streak_cache', true);
  }
}
