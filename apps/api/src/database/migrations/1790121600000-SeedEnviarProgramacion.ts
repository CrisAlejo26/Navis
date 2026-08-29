import { type MigrationInterface, type QueryRunner } from 'typeorm';

/**
 * La labor **Enviar programación** en el catálogo de las iglesias que ya lo
 * tienen sembrado.
 *
 * No lo arregla `MinistriesService.ensureFor`: solo siembra cuando el catálogo
 * está **vacío**, así que una iglesia que ya lo tenía no vería nunca la nueva.
 * Se añade aquí, y **escrita a mano**: una migración que importe
 * `SYSTEM_MINISTRIES` dejaría de estar congelada y crearía otra cosa el día que
 * esa constante cambie (ver `CreateRoles` en CLAUDE.md y `BelieverJourney`).
 */
const NUEVA = {
  slug: 'enviar-programacion',
  name: 'Enviar programación',
  accent: '#c026d3',
} as const;

export class SeedEnviarProgramacion1790121600000 implements MigrationInterface {
  name = 'SeedEnviarProgramacion1790121600000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';
    const mark = (index: number) => (isPostgres ? `$${String(index)}` : '?');

    /*
     * Solo a las iglesias que **ya tienen** catálogo: a las que no, se lo
     * sembrará `ensureFor` con la lista de hoy, que ya las incluye. Y solo las
     * que falten, que el índice único de (church_id, slug) no perdona.
     *
     * Se comprueba con un `SELECT` y se inserta después, en vez de un
     * `INSERT … WHERE NOT EXISTS`: la posición también sale de una consulta y
     * las dos juntas en una sola sentencia dejan un lío de marcadores que no
     * se lee. Es una labor por iglesia: no hay nada que optimizar aquí.
     */
    const iglesias: unknown = await queryRunner.query(
      `SELECT DISTINCT "church_id" AS id FROM "ministries"`,
    );

    for (const fila of isRows(iglesias) ? iglesias : []) {
      const churchId = text(fila, 'id');
      if (!churchId) continue;

      const yaEstá: unknown = await queryRunner.query(
        `SELECT 1 FROM "ministries" WHERE "church_id" = ${mark(1)} AND "slug" = ${mark(2)}`,
        [churchId, NUEVA.slug],
      );
      if (isRows(yaEstá) && yaEstá.length > 0) continue;

      const siguiente: unknown = await queryRunner.query(
        `SELECT COALESCE(MAX("position"), -1) + 1 AS n FROM "ministries" WHERE "church_id" = ${mark(1)}`,
        [churchId],
      );
      const position = isRows(siguiente) ? number(siguiente[0], 'n') : 0;

      await queryRunner.query(
        `INSERT INTO "ministries" ("id", "church_id", "slug", "name", "accent", "position", "is_system", "is_active")
         VALUES (${mark(1)}, ${mark(2)}, ${mark(3)}, ${mark(4)}, ${mark(5)}, ${mark(6)}, ${isPostgres ? 'true' : '1'}, ${isPostgres ? 'true' : '1'})`,
        [crypto.randomUUID(), churchId, NUEVA.slug, NUEVA.name, NUEVA.accent, position],
      );
    }
  }

  /**
   * Sin vuelta atrás: si alguien ya la tiene asignada, borrarla del catálogo
   * dejaría personas apuntando a una labor que no existe. Sobra una fila;
   * falta, no.
   */
  async down(): Promise<void> {
    /* Nada que quitar. */
  }
}

/** `Array.isArray` sobre un `unknown` lo estrecha a `any[]` (ver `CreateLists`). */
function isRows(value: unknown): value is readonly unknown[] {
  return Array.isArray(value);
}

function text(row: unknown, key: string): string | null {
  if (!row || typeof row !== 'object' || !(key in row)) return null;

  const value: unknown = Reflect.get(row, key);
  return typeof value === 'string' ? value : null;
}

/** `MAX(...)` vuelve como número en Postgres y a veces como texto en SQLite. */
function number(row: unknown, key: string): number {
  if (!row || typeof row !== 'object' || !(key in row)) return 0;

  const value: unknown = Reflect.get(row, key);
  const n = typeof value === 'number' ? value : Number(value);

  return Number.isFinite(n) ? n : 0;
}
