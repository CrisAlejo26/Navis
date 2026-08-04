import { Table, TableColumn, TableIndex, type MigrationInterface, type QueryRunner } from 'typeorm';

/**
 * La nota cambia de forma (RFC 0003 D15 y D16), y le crecen los audios.
 *
 * El cuerpo pasa a ser **dos campos**: lo que contó y la indicación que se le
 * dio. Se retira `title`, que resultó no describir cómo se escribe de verdad
 * una conversación pastoral: lo que se relee no es un titular, son las dos
 * columnas. Lo ya escrito no se pierde —el título viejo encabeza el texto—.
 *
 * `remind_at` es un instante y no un día: «el martes a las siete» lleva hora.
 *
 * Solo se crea el índice **nuevo**: al quitar una columna, SQLite recrea la
 * tabla entera, pero TypeORM vuelve a poner los índices que ya había. Crearlos
 * otra vez aquí falla con «index already exists».
 */
export class ReshapeBelieverNotes1787097600000 implements MigrationInterface {
  name = 'ReshapeBelieverNotes1787097600000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';
    const uuid = isPostgres ? 'uuid' : 'varchar';
    const timestamp = isPostgres ? 'timestamptz' : 'datetime';
    const now = isPostgres ? 'now()' : 'CURRENT_TIMESTAMP';

    await queryRunner.addColumns('believer_notes', [
      new TableColumn({ name: 'told', type: 'text', isNullable: false, default: "''" }),
      new TableColumn({ name: 'advice', type: 'text', isNullable: true }),
      new TableColumn({ name: 'remind_at', type: timestamp, isNullable: true }),
      new TableColumn({ name: 'remind_text', type: 'text', isNullable: true }),
      new TableColumn({ name: 'remind_done_at', type: timestamp, isNullable: true }),
    ]);

    // El título viejo encabeza el texto en vez de tirarse: era una línea que
    // alguien escribió, y perderla al migrar sería perder trabajo de alguien.
    await queryRunner.query(
      `UPDATE "believer_notes"
       SET "told" = CASE
         WHEN "title" IS NULL OR "title" = '' THEN "body"
         ELSE "title" || ': ' || "body"
       END`,
    );

    await queryRunner.dropColumn('believer_notes', 'title');
    await queryRunner.dropColumn('believer_notes', 'body');

    // Los recordatorios pendientes se piden por iglesia y por fecha.
    await queryRunner.createIndex(
      'believer_notes',
      new TableIndex({
        name: 'IDX_believer_notes_remind',
        columnNames: ['church_id', 'remind_at'],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'note_audios',
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
          { name: 'note_id', type: uuid, isNullable: false },
          { name: 'storage_key', type: 'text', isNullable: false },
          { name: 'mime_type', type: 'text', isNullable: false },
          { name: 'size_bytes', type: 'int', isNullable: false },
          { name: 'duration_seconds', type: 'int', isNullable: true },
          { name: 'recorded', type: 'boolean', isNullable: false, default: false },
        ],
        foreignKeys: [
          {
            columnNames: ['note_id'],
            referencedTableName: 'believer_notes',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'note_audios',
      new TableIndex({ name: 'IDX_note_audios_note', columnNames: ['note_id'] }),
    );
    await queryRunner.createIndex(
      'note_audios',
      new TableIndex({ name: 'IDX_note_audios_church', columnNames: ['church_id'] }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('note_audios', true);

    await queryRunner.addColumns('believer_notes', [
      new TableColumn({ name: 'title', type: 'text', isNullable: true }),
      new TableColumn({ name: 'body', type: 'text', isNullable: false, default: "''" }),
    ]);
    await queryRunner.query(`UPDATE "believer_notes" SET "body" = "told"`);
    await queryRunner.dropColumns('believer_notes', [
      'told',
      'advice',
      'remind_at',
      'remind_text',
      'remind_done_at',
    ]);
  }
}
