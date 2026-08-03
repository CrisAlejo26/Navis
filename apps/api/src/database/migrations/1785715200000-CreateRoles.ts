import { ROLE_HIERARCHY, ROLES } from '@navis/shared';
import { Table, TableIndex, type MigrationInterface, type QueryRunner } from 'typeorm';

/**
 * Tabla `roles`: el catálogo de roles del sistema.
 *
 * Las cuatro filas se siembran aquí mismo a partir de `ROLES` y
 * `ROLE_HIERARCHY` de `@navis/shared`, que es lo que usa el guard en tiempo de
 * compilación: importándolas en vez de copiarlas, la tabla y el tipo no pueden
 * desincronizarse.
 *
 * No hay clave foránea desde `user.role`: esa tabla la gestiona Better Auth y
 * SQLite no sabe añadirle una restricción después de crearla. La validación la
 * hace RolesService antes de escribir.
 */
export class CreateRoles1785715200000 implements MigrationInterface {
  name = 'CreateRoles1785715200000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';
    const timestamp = isPostgres ? 'timestamptz' : 'datetime';
    const now = isPostgres ? 'now()' : 'CURRENT_TIMESTAMP';

    await queryRunner.createTable(
      new Table({
        name: 'roles',
        columns: [
          {
            name: 'id',
            type: isPostgres ? 'uuid' : 'varchar',
            isPrimary: true,
            default: isPostgres ? 'gen_random_uuid()' : undefined,
          },
          { name: 'created_at', type: timestamp, isNullable: false, default: now },
          { name: 'updated_at', type: timestamp, isNullable: false, default: now },
          { name: 'deleted_at', type: timestamp, isNullable: true },
          { name: 'slug', type: 'text', isNullable: false },
          { name: 'level', type: 'int', isNullable: false },
          { name: 'is_system', type: 'boolean', isNullable: false, default: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'roles',
      new TableIndex({ name: 'UQ_roles_slug', columnNames: ['slug'], isUnique: true }),
    );

    for (const slug of ROLES) {
      // En Postgres el id lo pone el default de la columna; en SQLite no hay
      // generador de uuid, así que lo trae Node.
      const id = isPostgres ? null : crypto.randomUUID();
      const columns = id ? '"id", "slug", "level"' : '"slug", "level"';
      const values = id ? [id, slug, ROLE_HIERARCHY[slug]] : [slug, ROLE_HIERARCHY[slug]];
      const marks = values.map((_, i) => (isPostgres ? `$${String(i + 1)}` : '?')).join(', ');

      await queryRunner.query(`INSERT INTO "roles" (${columns}) VALUES (${marks})`, values);
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('roles', true);
  }
}
