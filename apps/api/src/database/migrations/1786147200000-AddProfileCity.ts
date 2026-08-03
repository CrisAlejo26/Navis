import { TableColumn, type MigrationInterface, type QueryRunner } from 'typeorm';

/**
 * La ciudad de cada cual, para el tiempo del panel de inicio.
 *
 * Es del perfil y no de la iglesia a propósito: quien atiende dos
 * congregaciones vive en una sola ciudad, y lo que quiere ver al abrir la
 * aplicación es el tiempo de donde está.
 */
export class AddProfileCity1786147200000 implements MigrationInterface {
  name = 'AddProfileCity1786147200000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'profiles',
      new TableColumn({ name: 'city', type: 'text', isNullable: true }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('profiles', 'city');
  }
}
