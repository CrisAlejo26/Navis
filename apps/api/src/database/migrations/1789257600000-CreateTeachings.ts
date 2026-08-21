import { Table, TableIndex, type MigrationInterface, type QueryRunner } from 'typeorm';

/**
 * Las **enseñanzas personales** (RFC 0022 §4.1).
 *
 * Sin `church_id` (mismo modelo que `prophecies`, RFC 0004 D1): es de quien
 * la escribe, no de una iglesia.
 *
 * `body_json` es `text` con `JSON.stringify`, igual en los dos motores —como
 * `custom_table_rows.data` (RFC 0021 D13)—, y no el `jsonb` nativo de
 * TypeORM, que se comporta distinto en Postgres y en SQLite.
 */
export class CreateTeachings1789257600000 implements MigrationInterface {
  name = 'CreateTeachings1789257600000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';
    const uuid = isPostgres ? 'uuid' : 'varchar';
    const timestamp = isPostgres ? 'timestamptz' : 'datetime';
    const now = isPostgres ? 'now()' : 'CURRENT_TIMESTAMP';

    await queryRunner.createTable(
      new Table({
        name: 'teachings',
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
          { name: 'owner_id', type: 'text', isNullable: false },
          { name: 'title', type: 'text', isNullable: false },
          { name: 'body_json', type: 'text', isNullable: false },
          { name: 'search_text', type: 'text', isNullable: false, default: "''" },
          { name: 'received_at', type: 'date', isNullable: false },
        ],
      }),
      true,
    );

    for (const index of [
      new TableIndex({
        name: 'IDX_teachings_owner_received',
        columnNames: ['owner_id', 'received_at'],
      }),
      new TableIndex({
        name: 'IDX_teachings_owner_search',
        columnNames: ['owner_id', 'search_text'],
      }),
    ]) {
      await queryRunner.createIndex('teachings', index);
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('teachings', true);
  }
}
