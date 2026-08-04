import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * «Encargado» y «Abre iglesia» en las reuniones fijas del púlpito.
 *
 * Son dos puestos que se reparten **todos los días** y que faltaban en la
 * semana de serie. Se **añaden al final**, sin tocar las fases que ya estaban:
 * appendear no le quita el sitio a nadie, y las reuniones ya materializadas
 * conservan las suyas (D7).
 */
export class AddPulpitDutyPhases1786752000000 implements MigrationInterface {
  name = 'AddPulpitDutyPhases1786752000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';
    const mark = (index: number) => (isPostgres ? `$${String(index)}` : '?');

    const filas: unknown = await queryRunner.query(
      `SELECT p."id" AS id FROM "meeting_patterns" p
         JOIN "calendars" c ON c."id" = p."calendar_id"
        WHERE p."deleted_at" IS NULL AND c."ministry" = 'pulpito'`,
    );

    for (const fila of Array.isArray(filas) ? (filas as unknown[]) : []) {
      const patternId =
        fila && typeof fila === 'object' && typeof (fila as Record<string, unknown>).id === 'string'
          ? ((fila as Record<string, unknown>).id as string)
          : null;
      if (!patternId) continue;

      const fases: unknown = await queryRunner.query(
        `SELECT "name", "position" FROM "pattern_phases"
          WHERE "pattern_id" = ${mark(1)} AND "deleted_at" IS NULL`,
        [patternId],
      );

      const existentes = (Array.isArray(fases) ? (fases as unknown[]) : []).map((fase) =>
        fase && typeof fase === 'object' ? (fase as Record<string, unknown>) : {},
      );

      const nombres = new Set(
        existentes.map((fase) => (typeof fase.name === 'string' ? fase.name : '')),
      );
      let position = existentes.reduce(
        (mayor, fase) => Math.max(mayor, typeof fase.position === 'number' ? fase.position : 0),
        -1,
      );

      for (const nombre of ['Encargado', 'Abre iglesia']) {
        if (nombres.has(nombre)) continue;
        position += 1;

        await queryRunner.query(
          `INSERT INTO "pattern_phases" ("id", "pattern_id", "name", "position")
           VALUES (${mark(1)}, ${mark(2)}, ${mark(3)}, ${mark(4)})`,
          [crypto.randomUUID(), patternId, nombre, position],
        );
      }
    }
  }

  async down(): Promise<void> {
    /* No se quitan: para entonces alguien estará asignado en ellas. */
  }
}
