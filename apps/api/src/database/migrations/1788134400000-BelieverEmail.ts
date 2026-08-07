import { TableColumn, type MigrationInterface, type QueryRunner } from 'typeorm';

/**
 * El **correo** de un creyente, para escribirle.
 *
 * Una columna nulable en `believers`, como `phone`: casi nadie lo tenía
 * anotado hasta que el listado de altas trajo una hoja con él, y una ficha sin
 * correo sigue siendo una ficha válida.
 */
export class BelieverEmail1788134400000 implements MigrationInterface {
  name = 'BelieverEmail1788134400000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'believers',
      new TableColumn({ name: 'email', type: 'text', isNullable: true }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('believers', 'email');
  }
}
