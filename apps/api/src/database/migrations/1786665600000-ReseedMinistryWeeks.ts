import { defaultWeekFor } from '@navis/shared';
import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * La semana de cada ministerio, en los calendarios que se sembraron con la del
 * púlpito antes de que hubiera una por ministerio.
 *
 * Recepción hace **turnos de puerta** con su propio horario y sonido cubre el
 * encuentro con dos puestos: la semana del púlpito —introducción, predicación,
 * testimonios— no les servía de nada.
 *
 * **Solo toca lo que nadie ha usado todavía**: si en ese calendario ya hay una
 * reunión materializada, alguien ha programado a alguien ahí y se deja como
 * está. Lo demás se puede reescribir sin perder trabajo de nadie.
 */
export class ReseedMinistryWeeks1786665600000 implements MigrationInterface {
  name = 'ReseedMinistryWeeks1786665600000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';
    const mark = (index: number) => (isPostgres ? `$${String(index)}` : '?');

    const filas: unknown = await queryRunner.query(
      `SELECT "id", "church_id", "ministry" FROM "calendars"
        WHERE "deleted_at" IS NULL AND "ministry" IN ('recepcion', 'sonido', 'biblias')`,
    );

    for (const fila of Array.isArray(filas) ? (filas as unknown[]) : []) {
      if (!fila || typeof fila !== 'object') continue;
      const leer = (campo: string): string | null => {
        const valor: unknown = (fila as Record<string, unknown>)[campo];
        return typeof valor === 'string' ? valor : null;
      };

      const calendarId = leer('id');
      const churchId = leer('church_id');
      const ministry = leer('ministry');
      if (!calendarId || !churchId) continue;

      // ¿Alguien ha programado ya algo aquí? Entonces no se toca.
      const usadas: unknown = await queryRunner.query(
        `SELECT "id" FROM "meetings" WHERE "calendar_id" = ${mark(1)} AND "deleted_at" IS NULL LIMIT 1`,
        [calendarId],
      );
      if (Array.isArray(usadas) && usadas.length > 0) continue;

      const sedes: unknown = await queryRunner.query(
        `SELECT "id", "accent" FROM "congregations"
          WHERE "church_id" = ${mark(1)} AND "deleted_at" IS NULL`,
        [churchId],
      );

      await queryRunner.query(
        `DELETE FROM "pattern_phases" WHERE "pattern_id" IN
           (SELECT "id" FROM "meeting_patterns" WHERE "calendar_id" = ${mark(1)})`,
        [calendarId],
      );
      await queryRunner.query(`DELETE FROM "meeting_patterns" WHERE "calendar_id" = ${mark(1)}`, [
        calendarId,
      ]);

      for (const sede of Array.isArray(sedes) ? (sedes as unknown[]) : []) {
        if (!sede || typeof sede !== 'object') continue;
        const congregationId = (sede as Record<string, unknown>).id;
        const accent = (sede as Record<string, unknown>).accent;
        if (typeof congregationId !== 'string') continue;

        for (const reunion of defaultWeekFor(ministry)) {
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
              typeof accent === 'string' ? accent : 'primary',
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
  }

  async down(): Promise<void> {
    /* Sin vuelta atrás: para entonces esas semanas ya estarán ajustadas. */
  }
}
