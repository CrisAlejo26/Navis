import { type MigrationInterface, type QueryRunner } from 'typeorm';

/**
 * `journal.view` y `journal.manage` en los roles que ya existen (RFC 0017
 * D10): pastor y predicador-apoyo, los dos que ya llevan el día a día pastoral
 * completo.
 *
 * `ROLE_PERMISSIONS` ya los siembra en una iglesia **nueva**; esta migración es
 * para las que no. Los permisos se escriben **a mano**, como en
 * `AddListPermissions`, para que esta migración no cambie si mañana cambia esa
 * constante (`CLAUDE.md`). Y solo **añade**: si alguien ya ajustó los permisos
 * de un rol desde la administración, no se le pisa lo que decidió.
 */
const NUEVOS: Record<string, readonly string[]> = {
  pastor: ['journal.view', 'journal.manage'],
  'predicador-apoyo': ['journal.view', 'journal.manage'],
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

export class SeedJournalPermissions1788566400000 implements MigrationInterface {
  name = 'SeedJournalPermissions1788566400000';

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

      const sin = rol.permissions.filter((one) => !one.startsWith('journal.'));

      await queryRunner.query(
        `UPDATE "roles" SET "permissions" = ${mark(1)} WHERE "id" = ${mark(2)}`,
        [JSON.stringify(sin), rol.id],
      );
    }
  }
}
