import { SEEDED_CALENDARS } from '@navis/shared';
import { Table, TableColumn, TableIndex, type MigrationInterface, type QueryRunner } from 'typeorm';

/**
 * Varios calendarios por iglesia (RFC 0002 D15): púlpito, recepción, sonido y
 * biblias, y los que cada iglesia quiera añadir.
 *
 * Siembra los cuatro de serie en cada iglesia y **lleva al de púlpito** las
 * reuniones fijas y las reuniones que ya existieran: antes de esto solo había
 * una cuadrícula, y era la del púlpito.
 */
export class CreateCalendars1786492800000 implements MigrationInterface {
  name = 'CreateCalendars1786492800000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';
    const uuid = isPostgres ? 'uuid' : 'varchar';
    const timestamp = isPostgres ? 'timestamptz' : 'datetime';
    const now = isPostgres ? 'now()' : 'CURRENT_TIMESTAMP';
    const mark = (index: number) => (isPostgres ? `$${String(index)}` : '?');

    await queryRunner.createTable(
      new Table({
        name: 'calendars',
        columns: [
          {
            name: 'id',
            type: uuid,
            isPrimary: true,
            default: isPostgres ? 'gen_random_uuid()' : undefined,
          },
          { name: 'created_at', type: timestamp, isNullable: false, default: now },
          { name: 'updated_at', type: timestamp, isNullable: false, default: now },
          { name: 'deleted_at', type: timestamp, isNullable: true },
          { name: 'church_id', type: uuid, isNullable: false },
          { name: 'name', type: 'text', isNullable: false },
          { name: 'slug', type: 'text', isNullable: false },
          { name: 'ministry', type: 'text', isNullable: true },
          { name: 'position', type: 'int', isNullable: false, default: 0 },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'calendars',
      new TableIndex({ name: 'IDX_calendars_church', columnNames: ['church_id'] }),
    );
    await queryRunner.createIndex(
      'calendars',
      new TableIndex({
        name: 'UQ_calendars_slug',
        columnNames: ['church_id', 'slug'],
        isUnique: true,
      }),
    );

    // Los cuatro de serie, en cada iglesia que ya exista.
    const filas: unknown = await queryRunner.query(`SELECT "id" FROM "churches"`);
    const iglesias: unknown[] = Array.isArray(filas) ? filas : [];
    const porIglesia = new Map<string, string>();

    for (const fila of iglesias) {
      if (!fila || typeof fila !== 'object') continue;
      const churchId = 'id' in fila && typeof fila.id === 'string' ? fila.id : null;
      if (!churchId) continue;

      for (const [position, calendario] of SEEDED_CALENDARS.entries()) {
        const id = crypto.randomUUID();
        if (calendario.slug === 'pulpito') porIglesia.set(churchId, id);

        await queryRunner.query(
          `INSERT INTO "calendars" ("id", "church_id", "name", "slug", "ministry", "position")
           VALUES (${mark(1)}, ${mark(2)}, ${mark(3)}, ${mark(4)}, ${mark(5)}, ${mark(6)})`,
          [id, churchId, calendario.name, calendario.slug, calendario.ministry, position],
        );
      }
    }

    /*
     * Lo que ya estaba programado era del púlpito: se le asigna su calendario.
     *
     * La columna se queda **nulable en la base** aunque la entidad la exija:
     * ponerla `NOT NULL` en SQLite obliga a recrear la tabla, y `meetings`
     * tiene una clave foránea colgando desde `meeting_slots`. Todo lo que se
     * escriba a partir de ahora la trae puesta, y lo que había se rellena aquí.
     */
    for (const tabla of ['meeting_patterns', 'meetings']) {
      await queryRunner.addColumn(
        tabla,
        new TableColumn({ name: 'calendar_id', type: uuid, isNullable: true }),
      );

      for (const [churchId, calendarId] of porIglesia) {
        await queryRunner.query(
          `UPDATE "${tabla}" SET "calendar_id" = ${mark(1)} WHERE "church_id" = ${mark(2)}`,
          [calendarId, churchId],
        );
      }

      await queryRunner.createIndex(
        tabla,
        new TableIndex({ name: `IDX_${tabla}_calendar`, columnNames: ['calendar_id'] }),
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('meetings', 'calendar_id');
    await queryRunner.dropColumn('meeting_patterns', 'calendar_id');
    await queryRunner.dropTable('calendars', true);
  }
}
