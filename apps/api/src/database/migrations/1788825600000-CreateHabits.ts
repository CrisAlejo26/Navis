import { Table, TableIndex, type MigrationInterface, type QueryRunner } from 'typeorm';

/** Los hábitos (RFC 0018 §5.3): mismas seis tablas que las tareas, con `habits` en vez de `tasks`. */
export class CreateHabits1788825600000 implements MigrationInterface {
  name = 'CreateHabits1788825600000';

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
        name: 'habits',
        columns: [
          ...base(),
          { name: 'church_id', type: uuid, isNullable: false },
          { name: 'owner_id', type: 'text', isNullable: false },
          { name: 'title', type: 'text', isNullable: false },
          { name: 'goal', type: 'text', isNullable: true },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'date', type: 'date', isNullable: false },
          { name: 'time', type: 'time', isNullable: true },
          { name: 'status', type: 'text', isNullable: true },
          { name: 'completed_at', type: timestamp, isNullable: true },
          { name: 'repeat_freq', type: 'text', isNullable: false, default: "'ninguna'" },
        ],
      }),
      true,
    );
    await queryRunner.createIndex(
      'habits',
      new TableIndex({
        name: 'IDX_habits_church_owner_date',
        columnNames: ['church_id', 'owner_id', 'date'],
      }),
    );
    await queryRunner.createIndex(
      'habits',
      new TableIndex({ name: 'IDX_habits_owner_date', columnNames: ['owner_id', 'date'] }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'habit_tags',
        columns: [
          ...base(),
          { name: 'habit_id', type: uuid, isNullable: false },
          { name: 'tag_id', type: uuid, isNullable: false },
        ],
        foreignKeys: [
          {
            columnNames: ['habit_id'],
            referencedTableName: 'habits',
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
      'habit_tags',
      new TableIndex({
        name: 'UQ_habit_tags',
        columnNames: ['habit_id', 'tag_id'],
        isUnique: true,
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'habit_occurrences',
        columns: [
          ...base(),
          { name: 'habit_id', type: uuid, isNullable: false },
          { name: 'date', type: 'date', isNullable: false },
          { name: 'status', type: 'text', isNullable: false },
          { name: 'completed_at', type: timestamp, isNullable: true },
        ],
        foreignKeys: [
          {
            columnNames: ['habit_id'],
            referencedTableName: 'habits',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );
    await queryRunner.createIndex(
      'habit_occurrences',
      new TableIndex({
        name: 'UQ_habit_occurrences',
        columnNames: ['habit_id', 'date'],
        isUnique: true,
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'habit_reminders',
        columns: [
          ...base(),
          { name: 'habit_id', type: uuid, isNullable: false, isUnique: true },
          { name: 'enabled', type: 'boolean', isNullable: false, default: true },
          { name: 'remind_at', type: timestamp, isNullable: false },
        ],
        foreignKeys: [
          {
            columnNames: ['habit_id'],
            referencedTableName: 'habits',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'habit_reminder_tags',
        columns: [
          ...base(),
          { name: 'reminder_id', type: uuid, isNullable: false },
          { name: 'tag_id', type: uuid, isNullable: false },
        ],
        foreignKeys: [
          {
            columnNames: ['reminder_id'],
            referencedTableName: 'habit_reminders',
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
      'habit_reminder_tags',
      new TableIndex({
        name: 'UQ_habit_reminder_tags',
        columnNames: ['reminder_id', 'tag_id'],
        isUnique: true,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('habit_reminder_tags', true);
    await queryRunner.dropTable('habit_reminders', true);
    await queryRunner.dropTable('habit_occurrences', true);
    await queryRunner.dropTable('habit_tags', true);
    await queryRunner.dropTable('habits', true);
  }
}
