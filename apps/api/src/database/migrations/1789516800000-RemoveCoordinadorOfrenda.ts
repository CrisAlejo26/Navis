import { type MigrationInterface, type QueryRunner } from 'typeorm';

/**
 * Deshace `SeedCoordinadorOfrenda`: ese rol nació de confundir una **labor**
 * de la iglesia con un **rol** de cuenta — «ofrenda» ya era una labor de
 * serie del catálogo de `ministries` (`SYSTEM_MINISTRIES`), así que la
 * plantilla «Ofrenda» del calendario ya tenía dónde apoyarse sin crear nada
 * nuevo. Con un rol de cuenta que nadie usa, la plantilla proponía labores
 * que ningún creyente podía tener marcadas, y el buscador de personas del
 * calendario se quedaba vacío.
 *
 * Mismo cuidado que el `down()` que deshace: solo se borra si nadie lo tiene
 * asignado a su cuenta.
 */
const SLUG = 'coordinador-ofrenda';

export class RemoveCoordinadorOfrenda1789516800000 implements MigrationInterface {
  name = 'RemoveCoordinadorOfrenda1789516800000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';
    const mark = (index: number) => (isPostgres ? `$${String(index)}` : '?');

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

  /** Vuelve a sembrarlo con el nivel y los permisos que tenía. */
  async down(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';
    const mark = (index: number) => (isPostgres ? `$${String(index)}` : '?');
    const yes = isPostgres ? true : 1;
    const permissions = JSON.stringify([
      'dashboard.view',
      'tasks.view',
      'calendar.view',
      'lists.view',
      'tables.view',
      'communications.view',
      'churches.view',
    ]);

    const rows: unknown = await queryRunner.query(
      `SELECT "id" FROM "roles" WHERE "slug" = ${mark(1)}`,
      [SLUG],
    );
    if (Array.isArray(rows) && rows.length > 0) return;

    const columns = ['"slug"', '"level"', '"permissions"', '"is_system"'];
    const values: unknown[] = [SLUG, 1, permissions, yes];
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
}
