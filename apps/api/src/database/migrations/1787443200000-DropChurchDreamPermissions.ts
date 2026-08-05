import type { MigrationInterface, QueryRunner } from 'typeorm';

/** Los que se van: los sueños dejan de ser cosa del rol de iglesia (D2). */
const RETIRADOS = ['dreams.view', 'dreams.manage'];

/**
 * Retira `dreams.view` y `dreams.manage` de los roles (RFC 0005 D2).
 *
 * Gemela de `DropChurchProphecyPermissions` y por el mismo motivo: con D1 un
 * sueño es de un usuario y no de una iglesia, así que un permiso de rol era un
 * fallo en dos direcciones —dejaba a alguien fuera de **sus propios** sueños y
 * sugería que concediéndolo se podían leer los de otro—.
 *
 * **Vale para una base que ya existe y para una nueva.** La migración que
 * siembra los roles importa `ROLE_PERMISSIONS` de `@navis/shared` (CLAUDE.md),
 * así que una base nueva ya nace sin ellos y aquí no hay nada que borrar. Eso
 * no es un error: es el caso normal en instalaciones nuevas.
 */
export class DropChurchDreamPermissions1787443200000 implements MigrationInterface {
  name = 'DropChurchDreamPermissions1787443200000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';
    // Los marcadores de parámetro no se escriben igual en los dos motores.
    const mark = (index: number) => (isPostgres ? `$${String(index)}` : '?');

    // `queryRunner.query` devuelve `any` y no acepta genérico (CLAUDE.md):
    // lo que sale se comprueba antes de usarlo (Regla 10).
    const rows: unknown = await queryRunner.query('SELECT "id", "permissions" FROM "roles"');
    if (!Array.isArray(rows)) return;

    for (const row of rows) {
      if (typeof row !== 'object' || row === null) continue;
      const { id, permissions } = row as { id?: unknown; permissions?: unknown };
      if (typeof id !== 'string') continue;

      const granted = parsePermissions(permissions);
      if (granted === null) continue;

      const kept = granted.filter((permission) => !RETIRADOS.includes(permission));
      if (kept.length === granted.length) continue;

      await queryRunner.query(
        `UPDATE "roles" SET "permissions" = ${mark(1)} WHERE "id" = ${mark(2)}`,
        [JSON.stringify(kept), id],
      );
    }
  }

  /**
   * No los devuelve, igual que su gemela: reponerlos sería adivinar a qué roles
   * pertenecían, y un permiso que ya no está en `PERMISSIONS` no concede nada.
   */
  async down(): Promise<void> {
    return Promise.resolve();
  }
}

/**
 * La columna es `simple-json`: texto con el array dentro en los dos motores.
 * Puede llegar ya parseada según el driver, así que se admiten las dos formas y
 * se descarta lo que no sea una lista de cadenas.
 */
function parsePermissions(value: unknown): string[] | null {
  const parsed: unknown = typeof value === 'string' ? safeParse(value) : value;
  if (!Array.isArray(parsed)) return null;
  return parsed.filter((one): one is string => typeof one === 'string');
}

function safeParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
