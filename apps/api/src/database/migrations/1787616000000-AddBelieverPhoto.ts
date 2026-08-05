import { TableColumn, type MigrationInterface, type QueryRunner } from 'typeorm';

/**
 * La fotografía de un creyente: opcional del todo.
 *
 * Solo la **clave del fichero**; la imagen vive en disco bajo `UPLOADS_PATH`,
 * como los audios de la bitácora, y por eso no entra en un volcado de Postgres
 * —esa carpeta va aparte en las copias de seguridad (CLAUDE.md)—.
 */
export class AddBelieverPhoto1787616000000 implements MigrationInterface {
  name = 'AddBelieverPhoto1787616000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'believers',
      new TableColumn({ name: 'photo_key', type: 'text', isNullable: true }),
    );
  }

  /**
   * Al quitar una columna en SQLite, TypeORM recrea la tabla y **vuelve a poner
   * los índices que había** (CLAUDE.md). Aquí no se crea ninguno nuevo, así que
   * no hay nada que rehacer a mano.
   */
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('believers', 'photo_key');
  }
}
