import { type MigrationInterface, type QueryRunner } from 'typeorm';

/**
 * `tasks.view` en los roles que ya tienen acceso al panel (RFC 0018 D7): todo
 * menos `creyente`. `ROLE_PERMISSIONS` ya lo siembra en una iglesia **nueva**;
 * esta migración es para las que no. Escrito a mano, como
 * `SeedJournalPermissions`, para que no dependa de esa constante — y solo
 * **añade**: no pisa lo que alguien ya haya ajustado desde la administración.
 */
const ROLES_CON_TASKS_VIEW = [
  'pastor',
  'recepcion',
  'biblias',
  'sonido',
  'pulpito',
  'predicador-apoyo',
];

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

export class SeedTasksPermission1788998400000 implements MigrationInterface {
  name = 'SeedTasksPermission1788998400000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';
    const mark = (index: number) => (isPostgres ? `$${String(index)}` : '?');

    for (const slug of ROLES_CON_TASKS_VIEW) {
      const rol = permissionsOf(
        await queryRunner.query(
          `SELECT "id", "permissions" FROM "roles" WHERE "slug" = ${mark(1)}`,
          [slug],
        ),
      );
      if (!rol) continue;
      if (rol.permissions.includes('tasks.view')) continue;

      const juntos = [...rol.permissions, 'tasks.view'];
      await queryRunner.query(
        `UPDATE "roles" SET "permissions" = ${mark(1)} WHERE "id" = ${mark(2)}`,
        [JSON.stringify(juntos), rol.id],
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';
    const mark = (index: number) => (isPostgres ? `$${String(index)}` : '?');

    for (const slug of ROLES_CON_TASKS_VIEW) {
      const rol = permissionsOf(
        await queryRunner.query(
          `SELECT "id", "permissions" FROM "roles" WHERE "slug" = ${mark(1)}`,
          [slug],
        ),
      );
      if (!rol) continue;

      const sin = rol.permissions.filter((one) => one !== 'tasks.view');
      await queryRunner.query(
        `UPDATE "roles" SET "permissions" = ${mark(1)} WHERE "id" = ${mark(2)}`,
        [JSON.stringify(sin), rol.id],
      );
    }
  }
}
