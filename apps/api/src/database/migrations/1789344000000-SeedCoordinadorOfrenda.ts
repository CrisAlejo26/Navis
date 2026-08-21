import { type MigrationInterface, type QueryRunner } from 'typeorm';

/**
 * El rol **coordinador de la ofrenda**: nació de confundir una labor de la
 * iglesia con un rol de cuenta, y lo deshace `RemoveCoordinadorOfrenda`
 * (D: «ofrenda» ya era una labor de serie del catálogo de `ministries`).
 *
 * **Este fichero se queda congelado a propósito.** Ya no importa
 * `ROLE_HIERARCHY`/`ROLE_PERMISSIONS` de `@navis/shared` porque esa constante
 * dejó de incluir este rol: una migración vieja no puede depender de que un
 * slug siga vivo en el código de hoy (es la misma trampa que ya avisa
 * `CLAUDE.md` sobre `CreateRoles`, al revés). Los valores de abajo son
 * exactamente los que tenía cuando esto se escribió.
 */
const SLUG = 'coordinador-ofrenda';
const LEVEL = 1;
const PERMISSIONS = [
  'dashboard.view',
  'tasks.view',
  'calendar.view',
  'lists.view',
  'tables.view',
  'communications.view',
  'churches.view',
];

export class SeedCoordinadorOfrenda1789344000000 implements MigrationInterface {
  name = 'SeedCoordinadorOfrenda1789344000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';
    const mark = (index: number) => (isPostgres ? `$${String(index)}` : '?');
    const yes = isPostgres ? true : 1;
    const level = LEVEL;
    const permissions = JSON.stringify(PERMISSIONS);

    const rows: unknown = await queryRunner.query(
      `SELECT "id" FROM "roles" WHERE "slug" = ${mark(1)}`,
      [SLUG],
    );
    const first: unknown = Array.isArray(rows) ? rows[0] : undefined;
    const id =
      first && typeof first === 'object' && 'id' in first && typeof first.id === 'string'
        ? first.id
        : undefined;

    if (id) {
      await queryRunner.query(
        `UPDATE "roles" SET "level" = ${mark(1)}, "permissions" = ${mark(2)},
                "is_system" = ${mark(3)}, "deleted_at" = NULL
         WHERE "id" = ${mark(4)}`,
        [level, permissions, yes, id],
      );
      return;
    }

    const columns = ['"slug"', '"level"', '"permissions"', '"is_system"'];
    const values: unknown[] = [SLUG, level, permissions, yes];
    if (!isPostgres) {
      columns.unshift('"id"');
      values.unshift(crypto.randomUUID());
    }
    const marks = values.map((_, index) => mark(index + 1)).join(', ');

    await queryRunner.query(
      `INSERT INTO "roles" (${columns.join(', ')}) VALUES (${marks})`,
      values,
    );
  }

  /** Solo se borra si nadie lo tiene: quitar el rol a una cuenta no es cosa de una migración. */
  async down(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';
    const mark = (index: number) => (isPostgres ? `$${String(index)}` : '?');

    // La tabla `user` es de Better Auth: si todavía no existe, nadie tiene el
    // rol y se puede borrar sin comprobarlo.
    if (!(await queryRunner.hasTable('user'))) {
      await queryRunner.query(`DELETE FROM "roles" WHERE "slug" = ${mark(1)}`, [SLUG]);
      return;
    }

    await queryRunner.query(
      `DELETE FROM "roles" WHERE "slug" = ${mark(1)}
         AND NOT EXISTS (SELECT 1 FROM "user" WHERE "role" = ${mark(2)})`,
      [SLUG, SLUG],
    );
  }
}
