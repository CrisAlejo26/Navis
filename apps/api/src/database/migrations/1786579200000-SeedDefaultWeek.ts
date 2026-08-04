import { DEFAULT_WEEK } from '@navis/shared';
import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * La semana de serie en lo que ya existe: para cada iglesia, cada calendario y
 * cada sede que todavía no tenga ninguna reunión fija.
 *
 * A partir de aquí la siembra la hace la API al crear un calendario o una sede
 * (`WeekSeederService`); esto es solo el traspaso de lo que había.
 *
 * **No pisa nada**: la pareja calendario–sede que ya tenga algo se salta. Quien
 * haya ajustado su semana no quiere encontrársela llena otra vez.
 */
export class SeedDefaultWeek1786579200000 implements MigrationInterface {
  name = 'SeedDefaultWeek1786579200000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';
    const mark = (index: number) => (isPostgres ? `$${String(index)}` : '?');

    const filas: unknown = await queryRunner.query(
      `SELECT c."id" AS calendar_id, c."church_id" AS church_id,
              g."id" AS congregation_id, g."accent" AS accent
         FROM "calendars" c
         JOIN "congregations" g ON g."church_id" = c."church_id"
        WHERE c."deleted_at" IS NULL AND g."deleted_at" IS NULL`,
    );

    const parejas: unknown[] = Array.isArray(filas) ? filas : [];

    for (const fila of parejas) {
      if (!fila || typeof fila !== 'object') continue;

      const leer = (campo: string): string | null => {
        const valor: unknown = campo in fila ? (fila as Record<string, unknown>)[campo] : null;
        return typeof valor === 'string' ? valor : null;
      };

      const calendarId = leer('calendar_id');
      const churchId = leer('church_id');
      const congregationId = leer('congregation_id');
      if (!calendarId || !churchId || !congregationId) continue;

      const existentes: unknown = await queryRunner.query(
        `SELECT "id" FROM "meeting_patterns"
          WHERE "calendar_id" = ${mark(1)} AND "congregation_id" = ${mark(2)}
            AND "deleted_at" IS NULL LIMIT 1`,
        [calendarId, congregationId],
      );
      if (Array.isArray(existentes) && existentes.length > 0) continue;

      for (const reunion of DEFAULT_WEEK) {
        const patternId = crypto.randomUUID();

        await queryRunner.query(
          `INSERT INTO "meeting_patterns"
             ("id", "church_id", "calendar_id", "congregation_id", "name", "weekday", "start_time", "accent")
           VALUES (${mark(1)}, ${mark(2)}, ${mark(3)}, ${mark(4)}, ${mark(5)}, ${mark(6)}, ${mark(7)}, ${mark(8)})`,
          [
            patternId,
            churchId,
            calendarId,
            congregationId,
            reunion.name,
            reunion.weekday,
            reunion.startTime,
            leer('accent') ?? 'primary',
          ],
        );

        for (const [position, phase] of reunion.phases.entries()) {
          await queryRunner.query(
            `INSERT INTO "pattern_phases" ("id", "pattern_id", "name", "position")
             VALUES (${mark(1)}, ${mark(2)}, ${mark(3)}, ${mark(4)})`,
            [crypto.randomUUID(), patternId, phase, position],
          );
        }
      }
    }
  }

  async down(): Promise<void> {
    /*
     * Sin vuelta atrás a propósito: para cuando se revierta, esas reuniones
     * fijas ya estarán editadas y tendrán programaciones colgando. Borrarlas
     * por su nombre se llevaría por delante trabajo de verdad.
     */
  }
}
