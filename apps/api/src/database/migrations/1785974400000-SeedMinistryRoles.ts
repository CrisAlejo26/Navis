import { ROLE_HIERARCHY, ROLE_PERMISSIONS, ROLES } from '@navis/shared';
import { type MigrationInterface, type QueryRunner } from 'typeorm';

/**
 * Los siete roles de serie de una iglesia, con sus permisos (RFC 0008).
 *
 * Sustituye a la escala `member < leader < pastor < admin`, que no sabía
 * describir a los ministerios: sonido y recepción no se ordenan entre sí.
 *
 * La migración es **idempotente y vale para los dos escenarios**, porque
 * `CreateRoles` siembra a partir de `ROLES` de `@navis/shared` y esa constante
 * acaba de cambiar:
 *   · Base de datos ya existente → tiene los cuatro viejos: se renombran los
 *     que tienen equivalente y se añaden los que faltan.
 *   · Base de datos nueva → `CreateRoles` ya ha creado los siete: aquí solo se
 *     les ponen el nivel y los permisos.
 */

/** Qué rol viejo pasa a ser cuál. `leader` era el más cercano a recepción. */
const RENAMES: readonly (readonly [string, string])[] = [
  ['admin', 'superadmin'],
  ['leader', 'recepcion'],
  ['member', 'creyente'],
];

export class SeedMinistryRoles1785974400000 implements MigrationInterface {
  name = 'SeedMinistryRoles1785974400000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';
    const mark = (index: number) => (isPostgres ? `$${String(index)}` : '?');
    const yes = isPostgres ? true : 1;
    // La tabla `user` es de Better Auth y su migración corre antes; si alguien
    // lanza solo las de TypeORM sobre una base vacía, todavía no está.
    const hasUsers = await queryRunner.hasTable('user');

    // `queryRunner.query` devuelve `any`: lo que llega se comprueba antes de
    // usarlo en vez de forzar el tipo con un `as` (Regla 10).
    const idOf = async (slug: string): Promise<string | undefined> => {
      const rows: unknown = await queryRunner.query(
        `SELECT "id" FROM "roles" WHERE "slug" = ${mark(1)}`,
        [slug],
      );
      const first: unknown = Array.isArray(rows) ? rows[0] : undefined;
      if (first && typeof first === 'object' && 'id' in first && typeof first.id === 'string') {
        return first.id;
      }
      return undefined;
    };

    for (const [before, after] of RENAMES) {
      const oldId = await idOf(before);
      if (!oldId) continue;

      // Si el nuevo ya existe, el viejo sobra; si no, se renombra y conserva su
      // id, que es lo que evita tocar nada que lo referencie.
      if (await idOf(after)) {
        await queryRunner.query(`DELETE FROM "roles" WHERE "id" = ${mark(1)}`, [oldId]);
      } else {
        await queryRunner.query(`UPDATE "roles" SET "slug" = ${mark(1)} WHERE "id" = ${mark(2)}`, [
          after,
          oldId,
        ]);
      }

      if (hasUsers) {
        await queryRunner.query(`UPDATE "user" SET "role" = ${mark(1)} WHERE "role" = ${mark(2)}`, [
          after,
          before,
        ]);
      }
    }

    for (const slug of ROLES) {
      const permissions = JSON.stringify(ROLE_PERMISSIONS[slug]);
      const id = await idOf(slug);

      if (id) {
        await queryRunner.query(
          `UPDATE "roles" SET "level" = ${mark(1)}, "permissions" = ${mark(2)},
                  "is_system" = ${mark(3)}, "deleted_at" = NULL
           WHERE "id" = ${mark(4)}`,
          [ROLE_HIERARCHY[slug], permissions, yes, id],
        );
        continue;
      }

      // En Postgres el id lo pone el default de la columna; en SQLite no hay
      // generador de uuid, así que lo trae Node (igual que en CreateRoles).
      const columns = ['"slug"', '"level"', '"permissions"', '"is_system"'];
      const values: unknown[] = [slug, ROLE_HIERARCHY[slug], permissions, yes];
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

  /**
   * Deshace los renombrados y se lleva los ministerios que no existían antes.
   * Las cuentas vuelven a su rol de siempre; las que tuvieran uno de los tres
   * nuevos se quedan como miembro, que era el mínimo de la escala vieja.
   */
  async down(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';
    const mark = (index: number) => (isPostgres ? `$${String(index)}` : '?');
    const hasUsers = await queryRunner.hasTable('user');

    for (const [before, after] of RENAMES) {
      await queryRunner.query(`UPDATE "roles" SET "slug" = ${mark(1)} WHERE "slug" = ${mark(2)}`, [
        before,
        after,
      ]);
      if (hasUsers) {
        await queryRunner.query(`UPDATE "user" SET "role" = ${mark(1)} WHERE "role" = ${mark(2)}`, [
          before,
          after,
        ]);
      }
    }

    for (const slug of ['biblias', 'sonido', 'pulpito']) {
      await queryRunner.query(`DELETE FROM "roles" WHERE "slug" = ${mark(1)}`, [slug]);
      if (hasUsers) {
        await queryRunner.query(`UPDATE "user" SET "role" = 'member' WHERE "role" = ${mark(1)}`, [
          slug,
        ]);
      }
    }
  }
}
