import { Table, TableIndex, type MigrationInterface, type QueryRunner } from 'typeorm';

/**
 * El **cuaderno** de la iglesia y sus audios (RFC 0017 §5.1).
 *
 * `journal_entries` es de la iglesia activa y no de quien la escribe (D1), al
 * revés que `prophecies` (RFC 0004 D1): tres índices, uno por cada forma en
 * que se lee — hacia atrás por fecha, las pastillas de tipo con su cuenta, y
 * los recordatorios pendientes.
 *
 * `journal_entry_audios` es el gemelo exacto de `note_audios` (D7): mismas
 * columnas, mismos índices, solo cambia de qué cuelga.
 */
export class CreateJournalEntries1788480000000 implements MigrationInterface {
  name = 'CreateJournalEntries1788480000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';
    const uuid = isPostgres ? 'uuid' : 'varchar';
    const timestamp = isPostgres ? 'timestamptz' : 'datetime';
    const now = isPostgres ? 'now()' : 'CURRENT_TIMESTAMP';

    await queryRunner.createTable(
      new Table({
        name: 'journal_entries',
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
          { name: 'title', type: 'text', isNullable: false },
          { name: 'kind', type: 'text', isNullable: false, default: "'observacion'" },
          { name: 'occurred_at', type: 'date', isNullable: false },
          { name: 'annotation', type: 'text', isNullable: false },
          { name: 'learned', type: 'text', isNullable: true },
          { name: 'search_text', type: 'text', isNullable: false, default: "''" },
          { name: 'remind_at', type: timestamp, isNullable: true },
          { name: 'remind_text', type: 'text', isNullable: true },
          { name: 'remind_done_at', type: timestamp, isNullable: true },
          { name: 'author_id', type: 'text', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'journal_entries',
      new TableIndex({
        name: 'IDX_journal_entries_church',
        columnNames: ['church_id', 'occurred_at'],
      }),
    );
    await queryRunner.createIndex(
      'journal_entries',
      new TableIndex({ name: 'IDX_journal_entries_kind', columnNames: ['church_id', 'kind'] }),
    );
    await queryRunner.createIndex(
      'journal_entries',
      new TableIndex({
        name: 'IDX_journal_entries_remind',
        columnNames: ['church_id', 'remind_at'],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'journal_entry_audios',
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
          { name: 'entry_id', type: uuid, isNullable: false },
          { name: 'storage_key', type: 'text', isNullable: false },
          { name: 'mime_type', type: 'text', isNullable: false },
          { name: 'size_bytes', type: 'int', isNullable: false },
          { name: 'duration_seconds', type: 'int', isNullable: true },
          { name: 'recorded', type: 'boolean', isNullable: false, default: false },
        ],
        foreignKeys: [
          {
            columnNames: ['entry_id'],
            referencedTableName: 'journal_entries',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'journal_entry_audios',
      new TableIndex({ name: 'IDX_journal_entry_audios_entry', columnNames: ['entry_id'] }),
    );
    await queryRunner.createIndex(
      'journal_entry_audios',
      new TableIndex({ name: 'IDX_journal_entry_audios_church', columnNames: ['church_id'] }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('journal_entry_audios', true);
    await queryRunner.dropTable('journal_entries', true);
  }
}
