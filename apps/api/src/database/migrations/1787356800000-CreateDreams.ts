import { Table, TableIndex, type MigrationInterface, type QueryRunner } from 'typeorm';

/**
 * Las doce emociones de serie (RFC 0005 §5.2).
 *
 * **Escritas literalmente y no importadas de `@navis/shared`**, a propósito
 * (D5): una migración que siembra a partir de una constante deja de estar
 * congelada, y al cambiar esa constante cambia lo que crea en una base nueva
 * pero no en las que ya existen. Ya pasó con `CreateRoles` y está apuntado en
 * `CLAUDE.md`.
 *
 * No guardan nombre: el texto lo pone la interfaz a partir del `slug`, que es
 * lo único que las deja salir en los seis idiomas (D4). Los colores son doce de
 * los dieciséis de `ACCENT_PALETTE`, también copiados aquí.
 */
const EMOCIONES: readonly (readonly [slug: string, accent: string])[] = [
  ['felicidad', '#ca8a04'],
  ['alegria', '#ea580c'],
  ['tranquilidad', '#0d9488'],
  ['paz', '#16a34a'],
  ['esperanza', '#0284c7'],
  ['libertad', '#0891b2'],
  ['curiosidad', '#9333ea'],
  ['confusion', '#6d28d9'],
  ['ansiedad', '#db2777'],
  ['tristeza', '#4f46e5'],
  ['miedo', '#57534e'],
  ['persecucion', '#dc2626'],
];

/**
 * Los **sueños personales**, su vocabulario de emociones y sus audios
 * (RFC 0005 §5).
 *
 * Sin `church_id` (D1): un sueño es de un usuario y no de una iglesia. Es la
 * segunda familia de tablas del proyecto así, después de las profecías.
 *
 * Sin columna de estado (D8): se deriva de `interpretation` y de `fulfilled_at`.
 * Y el cumplimiento son dos columnas y no una tabla hija (D9): un sueño pasó o
 * no pasó, no se cumple a trozos.
 */
export class CreateDreams1787356800000 implements MigrationInterface {
  name = 'CreateDreams1787356800000';

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
        name: 'dreams',
        columns: [
          primary,
          ...stamps,
          { name: 'owner_id', type: 'text', isNullable: false },
          { name: 'title', type: 'text', isNullable: true },
          { name: 'body', type: 'text', isNullable: false },
          { name: 'search_text', type: 'text', isNullable: false, default: "''" },
          { name: 'dreamed_at', type: 'date', isNullable: false },
          { name: 'interpretation', type: 'text', isNullable: true },
          { name: 'fulfilled_at', type: 'date', isNullable: true },
          { name: 'fulfillment_meaning', type: 'text', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'emotions',
        columns: [
          primary,
          ...stamps,
          // Nulo ⇒ es una de las de serie. No hay columna `is_system` (D6).
          { name: 'owner_id', type: 'text', isNullable: true },
          { name: 'slug', type: 'text', isNullable: true },
          { name: 'name', type: 'text', isNullable: true },
          { name: 'accent', type: 'text', isNullable: false, default: "'primary'" },
          { name: 'position', type: 'int', isNullable: false, default: 0 },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'dream_emotions',
        columns: [
          primary,
          ...stamps,
          { name: 'dream_id', type: uuid, isNullable: false },
          { name: 'emotion_id', type: uuid, isNullable: false },
        ],
        foreignKeys: [
          {
            columnNames: ['dream_id'],
            referencedTableName: 'dreams',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            // Sin `CASCADE`: una emoción se borra en lógico y la fila de la
            // unión sigue siendo cierta —ese sueño la llevaba—; lo que hace que
            // deje de verse es que ya no está en el vocabulario (D6).
            columnNames: ['emotion_id'],
            referencedTableName: 'emotions',
            referencedColumnNames: ['id'],
          },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'dream_audios',
        columns: [
          primary,
          ...stamps,
          { name: 'dream_id', type: uuid, isNullable: false },
          { name: 'storage_key', type: 'text', isNullable: false },
          { name: 'mime_type', type: 'text', isNullable: false },
          { name: 'size_bytes', type: 'int', isNullable: false },
          { name: 'duration_seconds', type: 'int', isNullable: true },
          { name: 'recorded', type: 'boolean', isNullable: false, default: false },
        ],
        foreignKeys: [
          {
            columnNames: ['dream_id'],
            referencedTableName: 'dreams',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    await this.createIndexes(queryRunner);
    await this.seedEmotions(queryRunner, isPostgres);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('dream_audios', true);
    await queryRunner.dropTable('dream_emotions', true);
    await queryRunner.dropTable('emotions', true);
    await queryRunner.dropTable('dreams', true);
  }

  private async createIndexes(queryRunner: QueryRunner): Promise<void> {
    for (const index of [
      new TableIndex({ name: 'IDX_dreams_owner_dreamed', columnNames: ['owner_id', 'dreamed_at'] }),
      new TableIndex({
        name: 'IDX_dreams_owner_fulfilled',
        columnNames: ['owner_id', 'fulfilled_at'],
      }),
      new TableIndex({ name: 'IDX_dreams_owner_search', columnNames: ['owner_id', 'search_text'] }),
    ]) {
      await queryRunner.createIndex('dreams', index);
    }

    await queryRunner.createIndex(
      'emotions',
      new TableIndex({ name: 'IDX_emotions_owner', columnNames: ['owner_id'] }),
    );
    // Parciales: una emoción de serie no tiene nombre y una propia no tiene
    // slug, así que sin el `WHERE` el índice único chocaría con los nulos.
    await queryRunner.createIndex(
      'emotions',
      new TableIndex({
        name: 'UQ_emotions_slug',
        columnNames: ['slug'],
        isUnique: true,
        where: '"slug" IS NOT NULL',
      }),
    );
    await queryRunner.createIndex(
      'emotions',
      new TableIndex({
        name: 'UQ_emotions_owner_name',
        columnNames: ['owner_id', 'name'],
        isUnique: true,
        where: '"name" IS NOT NULL',
      }),
    );

    await queryRunner.createIndex(
      'dream_emotions',
      new TableIndex({
        name: 'UQ_dream_emotions',
        columnNames: ['dream_id', 'emotion_id'],
        isUnique: true,
      }),
    );
    await queryRunner.createIndex(
      'dream_emotions',
      new TableIndex({ name: 'IDX_dream_emotions_emotion', columnNames: ['emotion_id'] }),
    );
    await queryRunner.createIndex(
      'dream_audios',
      new TableIndex({ name: 'IDX_dream_audios_dream', columnNames: ['dream_id'] }),
    );
  }

  /**
   * Las doce, con identificador generado aquí: SQLite no tiene función de uuid
   * y `gen_random_uuid()` solo existe en Postgres, así que lo pone el proceso.
   */
  private async seedEmotions(queryRunner: QueryRunner, isPostgres: boolean): Promise<void> {
    // Los marcadores de parámetro no se escriben igual en los dos motores.
    const mark = (index: number) => (isPostgres ? `$${String(index)}` : '?');
    const values = [1, 2, 3, 4].map((index) => mark(index)).join(', ');

    for (const [position, [slug, accent]] of EMOCIONES.entries()) {
      await queryRunner.query(
        `INSERT INTO "emotions" ("id", "slug", "accent", "position") VALUES (${values})`,
        [crypto.randomUUID(), slug, accent, position],
      );
    }
  }
}
