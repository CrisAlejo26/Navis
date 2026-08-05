import { type MigrationInterface, type QueryRunner } from 'typeorm';

/**
 * Los tres permisos de listas en los roles que ya existen (RFC 0010 D8).
 *
 * `SeedMinistryRoles` siembra a partir de `ROLE_PERMISSIONS`, así que una base
 * de datos **nueva** ya nace con ellos. Esta migración es para las que no: sin
 * ella, en una instalación en marcha la sección no la vería nadie salvo el
 * superadministrador, que va por comodín.
 *
 * Los permisos se escriben **a mano** por el mismo motivo que las cinco listas
 * de serie: importar la constante haría que esta migración cambiara con ella
 * (`CLAUDE.md`). Y solo **añade**: si alguien ya ajustó los permisos de un rol
 * desde la administración, no se le pisa lo que decidió.
 */
const NUEVOS: Record<string, readonly string[]> = {
  pastor: ['lists.view', 'lists.manage', 'lists.share'],
  recepcion: ['lists.view', 'lists.manage'],
  biblias: ['lists.view'],
  sonido: ['lists.view'],
  pulpito: ['lists.view'],
};

/** `queryRunner.query` devuelve `any`: se comprueba antes de usarlo (Regla 10). */
function permissionsOf(filas: unknown): { id: string; permissions: string[] } | null {
  const fila: unknown = Array.isArray(filas) ? filas[0] : undefined;
  if (!fila || typeof fila !== 'object') return null;

  const id = 'id' in fila && typeof fila.id === 'string' ? fila.id : null;
  const raw = 'permissions' in fila && typeof fila.permissions === 'string' ? fila.permissions : '';
  if (!id) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw || '[]');
  } catch {
    parsed = [];
  }

  const permissions = Array.isArray(parsed)
    ? parsed.filter((one): one is string => typeof one === 'string')
    : [];

  return { id, permissions };
}

export class AddListPermissions1787788800000 implements MigrationInterface {
  name = 'AddListPermissions1787788800000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';
    const mark = (index: number) => (isPostgres ? `$${String(index)}` : '?');

    for (const [slug, añadir] of Object.entries(NUEVOS)) {
      const rol = permissionsOf(
        await queryRunner.query(
          `SELECT "id", "permissions" FROM "roles" WHERE "slug" = ${mark(1)}`,
          [slug],
        ),
      );
      if (!rol) continue;

      const juntos = [...new Set([...rol.permissions, ...añadir])];
      if (juntos.length === rol.permissions.length) continue;

      await queryRunner.query(
        `UPDATE "roles" SET "permissions" = ${mark(1)} WHERE "id" = ${mark(2)}`,
        [JSON.stringify(juntos), rol.id],
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';
    const mark = (index: number) => (isPostgres ? `$${String(index)}` : '?');

    for (const slug of Object.keys(NUEVOS)) {
      const rol = permissionsOf(
        await queryRunner.query(
          `SELECT "id", "permissions" FROM "roles" WHERE "slug" = ${mark(1)}`,
          [slug],
        ),
      );
      if (!rol) continue;

      const sin = rol.permissions.filter((one) => !one.startsWith('lists.'));

      await queryRunner.query(
        `UPDATE "roles" SET "permissions" = ${mark(1)} WHERE "id" = ${mark(2)}`,
        [JSON.stringify(sin), rol.id],
      );
    }
  }
}
