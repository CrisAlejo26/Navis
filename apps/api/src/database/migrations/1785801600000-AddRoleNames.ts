import { TableColumn, type MigrationInterface, type QueryRunner } from 'typeorm';

/**
 * Nombre y descripción de los roles.
 *
 * Los cuatro de serie siguen con `name` a nulo: su nombre se traduce en la
 * interfaz a partir del slug (Regla 2). Lo rellenan los roles propios de cada
 * instalación, que no tienen traducción posible porque se los inventa quien
 * los crea.
 */
export class AddRoleNames1785801600000 implements MigrationInterface {
  name = 'AddRoleNames1785801600000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('roles', [
      new TableColumn({ name: 'name', type: 'text', isNullable: true }),
      new TableColumn({ name: 'description', type: 'text', isNullable: true }),
    ]);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('roles', ['name', 'description']);
  }
}
