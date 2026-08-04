import { Table, TableIndex, type MigrationInterface, type QueryRunner } from 'typeorm';

/**
 * La **bitácora** de cada hermano (RFC 0003 §5.3).
 *
 * Dos índices y ninguno de más: `(believer_id, occurred_at)` es la bitácora que
 * se lee hacia atrás, y `(church_id, occurred_at)` son las cuentas de la
 * cabecera, que se resuelven sin unir con `believers` porque `church_id` está
 * denormalizado a propósito.
 *
 * `occurred_at` es `date` y no un instante (D9): lo que pasó el 14 de julio
 * pasó el 14 de julio en cualquier huso.
 */
export class CreateBelieverNotes1787011200000 implements MigrationInterface {
  name = 'CreateBelieverNotes1787011200000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';
    const uuid = isPostgres ? 'uuid' : 'varchar';
    const timestamp = isPostgres ? 'timestamptz' : 'datetime';
    const now = isPostgres ? 'now()' : 'CURRENT_TIMESTAMP';

    await queryRunner.createTable(
      new Table({
        name: 'believer_notes',
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
          { name: 'believer_id', type: uuid, isNullable: false },
          { name: 'kind', type: 'text', isNullable: false, default: "'seguimiento'" },
          { name: 'occurred_at', type: 'date', isNullable: false },
          { name: 'title', type: 'text', isNullable: true },
          { name: 'body', type: 'text', isNullable: false },
          { name: 'gift_id', type: uuid, isNullable: true },
          { name: 'author_id', type: 'text', isNullable: true },
        ],
        foreignKeys: [
          {
            columnNames: ['believer_id'],
            referencedTableName: 'believers',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'believer_notes',
      new TableIndex({
        name: 'IDX_believer_notes_believer',
        columnNames: ['believer_id', 'occurred_at'],
      }),
    );
    await queryRunner.createIndex(
      'believer_notes',
      new TableIndex({
        name: 'IDX_believer_notes_church',
        columnNames: ['church_id', 'occurred_at'],
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('believer_notes', true);
  }
}
