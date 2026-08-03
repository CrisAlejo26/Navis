import { TableColumn, type MigrationInterface, type QueryRunner } from 'typeorm';

/**
 * Columna `permissions` del catálogo de roles.
 *
 * Guarda un array JSON como texto (`simple-json` de TypeORM), igual en los dos
 * motores: nunca se consulta por dentro, así que un `jsonb` de Postgres solo
 * añadiría una diferencia entre drivers que mantener.
 *
 * Aquí solo se crea la columna, vacía. Quién tiene qué lo decide la migración
 * siguiente, que es la que siembra los roles de serie.
 */
export class AddRolePermissions1785888000000 implements MigrationInterface {
  name = 'AddRolePermissions1785888000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'roles',
      new TableColumn({ name: 'permissions', type: 'text', isNullable: false, default: "'[]'" }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('roles', 'permissions');
  }
}
