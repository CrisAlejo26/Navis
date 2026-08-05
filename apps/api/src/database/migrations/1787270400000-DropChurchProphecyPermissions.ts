import type { MigrationInterface, QueryRunner } from 'typeorm';

/** Los que se van: las profecías dejan de ser cosa del rol de iglesia (D2). */
const RETIRADOS = ['prophecies.view', 'prophecies.manage'];

/**
 * Retira `prophecies.view` y `prophecies.manage` de los roles (RFC 0004 D2).
 *
 * Con D1 una profecía es de un usuario y no de una iglesia, así que un permiso
 * de rol era un fallo en dos direcciones: dejaba a alguien fuera de sus propias
 * profecías privadas, y sugería que concediéndolo se podían ver las de otro.
 *
 * **Tiene que valer para una base de datos que ya existe y para una nueva.** La
 * migración que siembra los roles importa `ROLE_PERMISSIONS` de `@navis/shared`
 * (CLAUDE.md), así que al quitarlos de esa constante una base nueva **ya nace
 * sin ellos** y aquí no hay nada que borrar. Eso no es un error: es el caso
 * normal en instalaciones nuevas.
 */
export class DropChurchProphecyPermissions1787270400000 implements MigrationInterface {
  name = 'DropChurchProphecyPermissions1787270400000';

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
   * No los devuelve. Reponerlos significaría adivinar a qué roles pertenecían, y
   * un permiso que ya no existe en `PERMISSIONS` no concede nada de todos modos
   * (`hasPermission` no casa con lo que no está en la lista).
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
