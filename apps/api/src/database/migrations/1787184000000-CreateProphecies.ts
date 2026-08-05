import { Table, TableIndex, type MigrationInterface, type QueryRunner } from 'typeorm';

/**
 * Las **profecías personales** y sus cumplimientos parciales (RFC 0004 §5.1).
 *
 * Sin `church_id` (D1): una profecía es de un usuario y no de una iglesia. Es la
 * única tabla de dominio del proyecto sin esa columna, y es a propósito.
 *
 * Sin columna de estado (D3): se deriva de `fulfilled_at` y de si hay algún
 * cumplimiento parcial. Guardarla además serían dos fuentes de verdad.
 *
 * `received_at`, `fulfilled_at` y `occurred_at` son `date` y no instantes (D5):
 * lo que se recibió el 14 de julio se recibió el 14 de julio en cualquier huso.
 */
export class CreateProphecies1787184000000 implements MigrationInterface {
  name = 'CreateProphecies1787184000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';
    const uuid = isPostgres ? 'uuid' : 'varchar';
    const timestamp = isPostgres ? 'timestamptz' : 'datetime';
    const now = isPostgres ? 'now()' : 'CURRENT_TIMESTAMP';
    const primary = {
      name: 'id',
      type: uuid,
      isPrimary: true,
      default: isPostgres ? 'gen_random_uuid()' : undefined,
    };
    const stamps = [
      { name: 'created_at', type: timestamp, isNullable: false, default: now },
      { name: 'updated_at', type: timestamp, isNullable: false, default: now },
      { name: 'deleted_at', type: timestamp, isNullable: true },
    ];

    await queryRunner.createTable(
      new Table({
        name: 'prophecies',
        columns: [
          primary,
          ...stamps,
          { name: 'owner_id', type: 'text', isNullable: false },
          { name: 'title', type: 'text', isNullable: false },
          { name: 'body', type: 'text', isNullable: false },
          { name: 'search_text', type: 'text', isNullable: false, default: "''" },
          { name: 'received_at', type: 'date', isNullable: false },
          { name: 'fulfilled_at', type: 'date', isNullable: true },
          { name: 'last_fulfillment_at', type: 'date', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'prophecy_fulfillments',
        columns: [
          primary,
          ...stamps,
          { name: 'prophecy_id', type: uuid, isNullable: false },
          { name: 'owner_id', type: 'text', isNullable: false },
          { name: 'text', type: 'text', isNullable: false },
          { name: 'occurred_at', type: 'date', isNullable: false },
        ],
        foreignKeys: [
          {
            columnNames: ['prophecy_id'],
            referencedTableName: 'prophecies',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    for (const index of [
      new TableIndex({
        name: 'IDX_prophecies_owner_received',
        columnNames: ['owner_id', 'received_at'],
      }),
      new TableIndex({
        name: 'IDX_prophecies_owner_fulfilled',
        columnNames: ['owner_id', 'fulfilled_at'],
      }),
      new TableIndex({
        name: 'IDX_prophecies_owner_search',
        columnNames: ['owner_id', 'search_text'],
      }),
    ]) {
      await queryRunner.createIndex('prophecies', index);
    }

    await queryRunner.createIndex(
      'prophecy_fulfillments',
      new TableIndex({
        name: 'IDX_prophecy_fulfillments_prophecy',
        columnNames: ['prophecy_id', 'occurred_at'],
      }),
    );
    await queryRunner.createIndex(
      'prophecy_fulfillments',
      new TableIndex({
        name: 'IDX_prophecy_fulfillments_owner',
        columnNames: ['owner_id'],
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('prophecy_fulfillments', true);
    await queryRunner.dropTable('prophecies', true);
  }
}
