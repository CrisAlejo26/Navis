import { type MigrationInterface, type QueryRunner } from 'typeorm';

/**
 * Los tres permisos de tablas en los roles que ya existen (RFC 0021, «API»):
 * mismo reparto que listas, con `tables.edit` (añadir y editar filas) en el
 * papel de `lists.manage` y `tables.manage` (columnas) en el de `lists.share`.
 *
 * `ROLE_PERMISSIONS` ya los siembra en una iglesia **nueva**; esta migración es
 * para las que no. Escritos a mano, como `AddListPermissions`, para que no
 * dependa de esa constante (`CLAUDE.md`) — y solo **añade**: no pisa lo que
 * alguien ya haya ajustado desde la administración.
 */
const NUEVOS: Record<string, readonly string[]> = {
  pastor: ['tables.view', 'tables.edit', 'tables.manage'],
  recepcion: ['tables.view', 'tables.edit'],
  biblias: ['tables.view'],
  sonido: ['tables.view'],
  pulpito: ['tables.view'],
  'predicador-apoyo': ['tables.view', 'tables.edit', 'tables.manage'],
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

export class SeedTablesPermissions1789171200000 implements MigrationInterface {
  name = 'SeedTablesPermissions1789171200000';

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

      const sin = rol.permissions.filter((one) => !one.startsWith('tables.'));

      await queryRunner.query(
        `UPDATE "roles" SET "permissions" = ${mark(1)} WHERE "id" = ${mark(2)}`,
        [JSON.stringify(sin), rol.id],
      );
    }
  }
}
