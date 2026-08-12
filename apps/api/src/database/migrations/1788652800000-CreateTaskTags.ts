import { Table, TableIndex, type MigrationInterface, type QueryRunner } from 'typeorm';

/**
 * El vocabulario de etiquetas de tareas y hábitos (RFC 0018 §5.1, D12): de
 * cada cuenta, por iglesia, sin filas de serie — mismo criterio que las
 * emociones de sueños.
 */
export class CreateTaskTags1788652800000 implements MigrationInterface {
  name = 'CreateTaskTags1788652800000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';
    const uuid = isPostgres ? 'uuid' : 'varchar';
    const timestamp = isPostgres ? 'timestamptz' : 'datetime';
    const now = isPostgres ? 'now()' : 'CURRENT_TIMESTAMP';

    await queryRunner.createTable(
      new Table({
        name: 'tags',
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
          { name: 'icon', type: 'text', isNullable: false },
          { name: 'accent', type: 'text', isNullable: false },
          { name: 'position', type: 'int', isNullable: false, default: 0 },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'tags',
      new TableIndex({ name: 'IDX_tags_church', columnNames: ['church_id'] }),
    );
    await queryRunner.createIndex(
      'tags',
      new TableIndex({
        name: 'UQ_tags_church_owner_name',
        columnNames: ['church_id', 'owner_id', 'name'],
        isUnique: true,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('tags', true);
  }
}
