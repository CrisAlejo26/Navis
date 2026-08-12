import { Table, TableIndex, type MigrationInterface, type QueryRunner } from 'typeorm';

/**
 * Las tareas (RFC 0018 §5.2): la plantilla (`tasks`), sus etiquetas, sus
 * ocurrencias materializadas (D3, D4) y su recordatorio 1:1 con las suyas
 * propias (D10, D11).
 *
 * El índice `(owner_id, date)` cubre tanto el listado como el cálculo de la
 * racha (§6.2): no se hace parcial a las no repetitivas (§5.5) porque
 * TypeORM no expresa un índice parcial con la API `Table` sin SQL a mano, y
 * el coste de indexar también las repetitivas —unas pocas filas por
 * cuenta— no compensa la complejidad extra en los dos motores.
 */
export class CreateTasks1788739200000 implements MigrationInterface {
  name = 'CreateTasks1788739200000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';
    const uuid = isPostgres ? 'uuid' : 'varchar';
    const timestamp = isPostgres ? 'timestamptz' : 'datetime';
    const now = isPostgres ? 'now()' : 'CURRENT_TIMESTAMP';
    const base = (): {
      name: string;
      type: string;
      isPrimary?: boolean;
      isNullable?: boolean;
      default?: string;
    }[] => [
      {
        name: 'id',
        type: uuid,
        isPrimary: true,
        default: isPostgres ? 'gen_random_uuid()' : undefined,
      },
      { name: 'created_at', type: timestamp, isNullable: false, default: now },
      { name: 'updated_at', type: timestamp, isNullable: false, default: now },
      { name: 'deleted_at', type: timestamp, isNullable: true },
    ];

    await queryRunner.createTable(
      new Table({
        name: 'tasks',
        columns: [
          ...base(),
          { name: 'church_id', type: uuid, isNullable: false },
          { name: 'owner_id', type: 'text', isNullable: false },
          { name: 'title', type: 'text', isNullable: false },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'date', type: 'date', isNullable: false },
          { name: 'time', type: 'time', isNullable: true },
          { name: 'priority', type: 'text', isNullable: false, default: "'media'" },
          { name: 'status', type: 'text', isNullable: true },
          { name: 'completed_at', type: timestamp, isNullable: true },
          { name: 'is_recurring', type: 'boolean', isNullable: false, default: false },
          { name: 'repeat_freq', type: 'text', isNullable: true },
          { name: 'repeat_interval', type: 'int', isNullable: false, default: 1 },
          { name: 'repeat_end_type', type: 'text', isNullable: true },
          { name: 'repeat_end_date', type: 'date', isNullable: true },
          { name: 'repeat_end_count', type: 'int', isNullable: true },
        ],
      }),
      true,
    );
    await queryRunner.createIndex(
      'tasks',
      new TableIndex({
        name: 'IDX_tasks_church_owner_date',
        columnNames: ['church_id', 'owner_id', 'date'],
      }),
    );
    await queryRunner.createIndex(
      'tasks',
      new TableIndex({ name: 'IDX_tasks_owner_date', columnNames: ['owner_id', 'date'] }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'task_tags',
        columns: [
          ...base(),
          { name: 'task_id', type: uuid, isNullable: false },
          { name: 'tag_id', type: uuid, isNullable: false },
        ],
        foreignKeys: [
          {
            columnNames: ['task_id'],
            referencedTableName: 'tasks',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['tag_id'],
            referencedTableName: 'tags',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );
    await queryRunner.createIndex(
      'task_tags',
      new TableIndex({ name: 'UQ_task_tags', columnNames: ['task_id', 'tag_id'], isUnique: true }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'task_occurrences',
        columns: [
          ...base(),
          { name: 'task_id', type: uuid, isNullable: false },
          { name: 'date', type: 'date', isNullable: false },
          { name: 'status', type: 'text', isNullable: false },
          { name: 'completed_at', type: timestamp, isNullable: true },
        ],
        foreignKeys: [
          {
            columnNames: ['task_id'],
            referencedTableName: 'tasks',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );
    await queryRunner.createIndex(
      'task_occurrences',
      new TableIndex({
        name: 'UQ_task_occurrences',
        columnNames: ['task_id', 'date'],
        isUnique: true,
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'task_reminders',
        columns: [
          ...base(),
          { name: 'task_id', type: uuid, isNullable: false, isUnique: true },
          { name: 'enabled', type: 'boolean', isNullable: false, default: true },
          { name: 'remind_at', type: timestamp, isNullable: false },
        ],
        foreignKeys: [
          {
            columnNames: ['task_id'],
            referencedTableName: 'tasks',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'task_reminder_tags',
        columns: [
          ...base(),
          { name: 'reminder_id', type: uuid, isNullable: false },
          { name: 'tag_id', type: uuid, isNullable: false },
        ],
        foreignKeys: [
          {
            columnNames: ['reminder_id'],
            referencedTableName: 'task_reminders',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['tag_id'],
            referencedTableName: 'tags',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );
    await queryRunner.createIndex(
      'task_reminder_tags',
      new TableIndex({
        name: 'UQ_task_reminder_tags',
        columnNames: ['reminder_id', 'tag_id'],
        isUnique: true,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('task_reminder_tags', true);
    await queryRunner.dropTable('task_reminders', true);
    await queryRunner.dropTable('task_occurrences', true);
    await queryRunner.dropTable('task_tags', true);
    await queryRunner.dropTable('tasks', true);
  }
}
