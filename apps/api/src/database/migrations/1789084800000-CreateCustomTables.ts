import { Table, TableIndex, type MigrationInterface, type QueryRunner } from 'typeorm';

/**
 * Las **tablas personalizadas** (RFC 0021): `custom_tables`, sus columnas, sus
 * filas y sus vistas guardadas.
 *
 * `custom_table_columns` y `custom_table_views` no llevan `deleted_at`: su
 * borrado lógico es `is_active` (columnas, D10) o directamente `ON DELETE
 * CASCADE` sin más (vistas, D24) — es lo mismo que reflejan sus entidades, sin
 * `BaseEntity`. `custom_table_rows` sí lo lleva, como cualquier fila de datos.
 */
export class CreateCustomTables1789084800000 implements MigrationInterface {
  name = 'CreateCustomTables1789084800000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';
    const uuid = isPostgres ? 'uuid' : 'varchar';
    const timestamp = isPostgres ? 'timestamptz' : 'datetime';
    const now = isPostgres ? 'now()' : 'CURRENT_TIMESTAMP';
    const genId = () => ({ default: isPostgres ? 'gen_random_uuid()' : undefined });

    await queryRunner.createTable(
      new Table({
        name: 'custom_tables',
        columns: [
          { name: 'id', type: uuid, isPrimary: true, ...genId() },
          { name: 'created_at', type: timestamp, isNullable: false, default: now },
          { name: 'updated_at', type: timestamp, isNullable: false, default: now },
          { name: 'deleted_at', type: timestamp, isNullable: true },
          { name: 'church_id', type: uuid, isNullable: false },
          { name: 'name', type: 'text', isNullable: false },
          { name: 'slug', type: 'text', isNullable: false },
          { name: 'icon', type: 'text', isNullable: false },
          { name: 'accent', type: 'text', isNullable: false },
          { name: 'position', type: 'int', isNullable: false, default: 0 },
          { name: 'is_active', type: 'boolean', isNullable: false, default: true },
          { name: 'created_by', type: 'text', isNullable: true },
        ],
      }),
      true,
    );
    await queryRunner.createIndex(
      'custom_tables',
      new TableIndex({ name: 'IDX_custom_tables_church', columnNames: ['church_id'] }),
    );
    await queryRunner.createIndex(
      'custom_tables',
      new TableIndex({
        name: 'UQ_custom_tables_slug',
        columnNames: ['church_id', 'slug'],
        isUnique: true,
      }),
    );
    await queryRunner.createIndex(
      'custom_tables',
      new TableIndex({
        name: 'UQ_custom_tables_name',
        columnNames: ['church_id', 'name'],
        isUnique: true,
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'custom_table_columns',
        columns: [
          { name: 'id', type: uuid, isPrimary: true, ...genId() },
          { name: 'created_at', type: timestamp, isNullable: false, default: now },
          { name: 'updated_at', type: timestamp, isNullable: false, default: now },
          { name: 'table_id', type: uuid, isNullable: false },
          { name: 'key', type: 'text', isNullable: false },
          { name: 'label', type: 'text', isNullable: false },
          { name: 'type', type: 'text', isNullable: false },
          { name: 'position', type: 'int', isNullable: false, default: 0 },
          { name: 'required', type: 'boolean', isNullable: false, default: false },
          { name: 'options', type: 'text', isNullable: true },
          { name: 'config', type: 'text', isNullable: true },
          { name: 'is_active', type: 'boolean', isNullable: false, default: true },
        ],
        foreignKeys: [
          {
            columnNames: ['table_id'],
            referencedTableName: 'custom_tables',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );
    await queryRunner.createIndex(
      'custom_table_columns',
      new TableIndex({ name: 'IDX_custom_table_columns_table', columnNames: ['table_id'] }),
    );
    await queryRunner.createIndex(
      'custom_table_columns',
      new TableIndex({
        name: 'UQ_custom_table_columns_key',
        columnNames: ['table_id', 'key'],
        isUnique: true,
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'custom_table_rows',
        columns: [
          { name: 'id', type: uuid, isPrimary: true, ...genId() },
          { name: 'created_at', type: timestamp, isNullable: false, default: now },
          { name: 'updated_at', type: timestamp, isNullable: false, default: now },
          { name: 'deleted_at', type: timestamp, isNullable: true },
          { name: 'table_id', type: uuid, isNullable: false },
          { name: 'data', type: 'text', isNullable: false, default: "'{}'" },
          { name: 'created_by', type: 'text', isNullable: true },
        ],
        foreignKeys: [
          {
            columnNames: ['table_id'],
            referencedTableName: 'custom_tables',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );
    await queryRunner.createIndex(
      'custom_table_rows',
      new TableIndex({ name: 'IDX_custom_table_rows_table', columnNames: ['table_id'] }),
    );
    // La consulta de la página por defecto (D17, D19): la tabla sola, sin relaciones.
    await queryRunner.createIndex(
      'custom_table_rows',
      new TableIndex({
        name: 'IDX_custom_table_rows_page',
        columnNames: ['table_id', 'created_at'],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'custom_table_views',
        columns: [
          { name: 'id', type: uuid, isPrimary: true, ...genId() },
          { name: 'created_at', type: timestamp, isNullable: false, default: now },
          { name: 'updated_at', type: timestamp, isNullable: false, default: now },
          { name: 'table_id', type: uuid, isNullable: false },
          { name: 'name', type: 'text', isNullable: false },
          { name: 'type', type: 'text', isNullable: false },
          { name: 'group_by', type: 'text', isNullable: true },
          { name: 'date_column', type: 'text', isNullable: true },
          { name: 'filters', type: 'text', isNullable: false, default: "'[]'" },
          { name: 'sort_by', type: 'text', isNullable: true },
          { name: 'sort_order', type: 'text', isNullable: false, default: "'desc'" },
          { name: 'position', type: 'int', isNullable: false, default: 0 },
        ],
        foreignKeys: [
          {
            columnNames: ['table_id'],
            referencedTableName: 'custom_tables',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );
    await queryRunner.createIndex(
      'custom_table_views',
      new TableIndex({ name: 'IDX_custom_table_views_table', columnNames: ['table_id'] }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('custom_table_views', true);
    await queryRunner.dropTable('custom_table_rows', true);
    await queryRunner.dropTable('custom_table_columns', true);
    await queryRunner.dropTable('custom_tables', true);
  }
}
