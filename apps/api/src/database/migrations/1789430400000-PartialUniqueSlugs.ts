import { TableIndex, type MigrationInterface, type QueryRunner } from 'typeorm';

/**
 * `UQ_calendars_slug`, `UQ_lists_slug`, `UQ_lists_name`,
 * `UQ_custom_tables_slug` y `UQ_custom_tables_name` **no excluían el borrado
 * lógico**: borrar «Ofrenda» y volver a crear otra con el mismo nombre chocaba
 * contra la fila borrada —que sigue en la tabla, solo con `deleted_at`
 * puesto— con un 409 que no decía de dónde salía. `freeSlug()` y la
 * comprobación de nombre ya excluyen lo borrado (`find`/`exists` lo hacen
 * solas); el índice de la base de datos es lo único que no lo sabía.
 *
 * Mismo arreglo que ya tiene `UQ_emotions_slug` (D6): un índice único
 * **parcial**, con `WHERE "deleted_at" IS NULL`. Sostenible en los dos
 * motores.
 */
export class PartialUniqueSlugs1789430400000 implements MigrationInterface {
  name = 'PartialUniqueSlugs1789430400000';

  async up(queryRunner: QueryRunner): Promise<void> {
    for (const { table, name, columns } of INDEXES) {
      await queryRunner.dropIndex(table, name);
      await queryRunner.createIndex(
        table,
        new TableIndex({ name, columnNames: columns, isUnique: true, where: WHERE }),
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    for (const { table, name, columns } of INDEXES) {
      await queryRunner.dropIndex(table, name);
      await queryRunner.createIndex(
        table,
        new TableIndex({ name, columnNames: columns, isUnique: true }),
      );
    }
  }
}

const WHERE = '"deleted_at" IS NULL';

const INDEXES = [
  { table: 'calendars', name: 'UQ_calendars_slug', columns: ['church_id', 'slug'] },
  { table: 'lists', name: 'UQ_lists_slug', columns: ['church_id', 'slug'] },
  { table: 'lists', name: 'UQ_lists_name', columns: ['church_id', 'name'] },
  { table: 'custom_tables', name: 'UQ_custom_tables_slug', columns: ['church_id', 'slug'] },
  { table: 'custom_tables', name: 'UQ_custom_tables_name', columns: ['church_id', 'name'] },
];
