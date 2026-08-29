import { type MigrationInterface, type QueryRunner } from 'typeorm';

/**
 * La reunión del viernes de «Enviar programación» se llamaba igual que su fase
 * —«Enviar programación» los dos—, y al compartir el calendario salía el título
 * repetido dos veces: «Enviar programación (09:00)» y debajo «Enviar
 * programación · Nombre».
 *
 * El encuentro pasa a llamarse «Programación» y la fase se queda «Enviar
 * programación» —la reunión y el puesto, como en el resto de ministerios—.
 * Solo se tocan los calendarios de la labor `enviar-programacion`, que es la
 * única que pudo sembrar esa semana.
 *
 * Escrita a mano, sin importar de `@navis/shared`: una migración que importe
 * `defaultWeekFor` dejaría de estar congelada (ver `CreateRoles` en CLAUDE.md).
 */
export class RenameProgramSendingMeeting1790294400000 implements MigrationInterface {
  name = 'RenameProgramSendingMeeting1790294400000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "meeting_patterns" SET "name" = 'Programación'
       WHERE "name" = 'Enviar programación'
         AND "calendar_id" IN
           (SELECT "id" FROM "calendars" WHERE "ministry" = 'enviar-programacion' AND "deleted_at" IS NULL)`,
    );

    await queryRunner.query(
      `UPDATE "meetings" SET "name" = 'Programación'
       WHERE "name" = 'Enviar programación'
         AND "calendar_id" IN
           (SELECT "id" FROM "calendars" WHERE "ministry" = 'enviar-programacion' AND "deleted_at" IS NULL)`,
    );
  }

  /** Sin vuelta atrás: los nombres ya pueden estar editados a mano. */
  async down(): Promise<void> {
    /* Nada que deshacer. */
  }
}
