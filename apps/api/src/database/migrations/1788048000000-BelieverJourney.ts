import { TableColumn, type MigrationInterface, type QueryRunner } from 'typeorm';

/**
 * La **trayectoria** de un creyente (RFC 0012).
 *
 * Tres cosas:
 *
 * - Cinco columnas en `believers`: cuándo llegó, a qué sede llegó y las tres
 *   cuentas —Biblia, vivencias e institutos—. Todas nulables: son datos que se
 *   completan con los años y una ficha a medias es lo normal, no un error.
 * - Una fecha en cada tabla puente: cuándo recibió el don, cuándo empezó la
 *   labor. Nula casi siempre, y el don o la labor valen igual sin ella.
 * - **Vigilancia y micrófono**, que faltaban en el catálogo de labores.
 *
 * Lo último no lo arregla `MinistriesService.ensureFor`: solo siembra cuando el
 * catálogo está **vacío**, así que una iglesia que ya lo tenía no vería nunca
 * las dos nuevas. Se añaden aquí, y **escritas a mano**: una migración que
 * importe `SYSTEM_MINISTRIES` dejaría de estar congelada y crearía otra cosa el
 * día que esa constante cambie (ver `CreateRoles` en CLAUDE.md).
 */
const NUEVAS = [
  { slug: 'vigilancia', name: 'Vigilancia', accent: '#0d9488' },
  { slug: 'microfono', name: 'Micrófono', accent: '#e11d48' },
] as const;

export class BelieverJourney1788048000000 implements MigrationInterface {
  name = 'BelieverJourney1788048000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';
    const mark = (index: number) => (isPostgres ? `$${String(index)}` : '?');

    await queryRunner.addColumns('believers', [
      new TableColumn({ name: 'arrived_at', type: 'date', isNullable: true }),
      new TableColumn({ name: 'arrival_site', type: 'text', isNullable: true }),
      new TableColumn({ name: 'bible_readings', type: 'int', isNullable: true }),
      new TableColumn({ name: 'vivencias_readings', type: 'int', isNullable: true }),
      new TableColumn({ name: 'bible_institute_times', type: 'int', isNullable: true }),
    ]);

    await queryRunner.addColumn(
      'believer_gifts',
      new TableColumn({ name: 'received_at', type: 'date', isNullable: true }),
    );
    await queryRunner.addColumn(
      'believer_ministries',
      new TableColumn({ name: 'started_at', type: 'date', isNullable: true }),
    );

    /*
     * Solo a las iglesias que **ya tienen** catálogo: a las que no, se lo
     * sembrará `ensureFor` con la lista de hoy, que ya las incluye. Y solo las
     * que falten, que el índice único de (church_id, slug) no perdona.
     *
     * Se comprueba con un `SELECT` y se inserta después, en vez de un
     * `INSERT … WHERE NOT EXISTS`: la posición también sale de una consulta y
     * las dos juntas en una sola sentencia dejan un lío de marcadores que no
     * se lee. Son dos labores por iglesia: no hay nada que optimizar aquí.
     */
    const iglesias: unknown = await queryRunner.query(
      `SELECT DISTINCT "church_id" AS id FROM "ministries"`,
    );

    for (const fila of isRows(iglesias) ? iglesias : []) {
      const churchId = text(fila, 'id');
      if (!churchId) continue;

      for (const nueva of NUEVAS) {
        const yaEstá: unknown = await queryRunner.query(
          `SELECT 1 FROM "ministries" WHERE "church_id" = ${mark(1)} AND "slug" = ${mark(2)}`,
          [churchId, nueva.slug],
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
          [crypto.randomUUID(), churchId, nueva.slug, nueva.name, nueva.accent, position],
        );
      }
    }
  }

  /**
   * Al revés se quitan las columnas, **pero las dos labores se quedan**: si
   * alguien ya las tiene asignadas, borrarlas del catálogo dejaría personas
   * apuntando a una labor que no existe. Sobra una fila; falta, no.
   */
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('believer_ministries', 'started_at');
    await queryRunner.dropColumn('believer_gifts', 'received_at');
    await queryRunner.dropColumns('believers', [
      'arrived_at',
      'arrival_site',
      'bible_readings',
      'vivencias_readings',
      'bible_institute_times',
    ]);
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
