import { Table, TableIndex, type MigrationInterface, type QueryRunner } from 'typeorm';

/**
 * El calendario de programaciones (RFC 0002): patrones semanales con sus fases
 * y las reuniones que se materializan al tocarlas, cada una con sus fases y
 * quién las ocupa.
 *
 * `date` y `time` se llaman igual en los dos motores y TypeORM los devuelve
 * como texto en ambos, que es justamente lo que se quiere: una programación es
 * un día de calendario y una hora de reloj de pared, no un instante (D5).
 */
export class CreateMeetings1786406400000 implements MigrationInterface {
  name = 'CreateMeetings1786406400000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';
    const uuid = isPostgres ? 'uuid' : 'varchar';
    const timestamp = isPostgres ? 'timestamptz' : 'datetime';
    const now = isPostgres ? 'now()' : 'CURRENT_TIMESTAMP';

    const comunes = [
      {
        name: 'id',
        type: uuid,
        isPrimary: true,
        default: isPostgres ? 'gen_random_uuid()' : undefined,
      },
      { name: 'created_at', type: timestamp, isNullable: false, default: now },
      { name: 'updated_at', type: timestamp, isNullable: false, default: now },
      { name: 'deleted_at', type: timestamp, isNullable: true },
    ];

    await queryRunner.createTable(
      new Table({
        name: 'meeting_patterns',
        columns: [
          ...comunes,
          { name: 'church_id', type: uuid, isNullable: false },
          { name: 'congregation_id', type: uuid, isNullable: false },
          { name: 'name', type: 'text', isNullable: false },
          { name: 'weekday', type: 'int', isNullable: false },
          { name: 'start_time', type: 'time', isNullable: false },
          { name: 'accent', type: 'text', isNullable: false, default: "'primary'" },
          { name: 'is_active', type: 'boolean', isNullable: false, default: true },
          { name: 'valid_from', type: 'date', isNullable: true },
          { name: 'valid_to', type: 'date', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'meeting_patterns',
      new TableIndex({ name: 'IDX_meeting_patterns_church', columnNames: ['church_id'] }),
    );
    await queryRunner.createIndex(
      'meeting_patterns',
      new TableIndex({
        name: 'IDX_meeting_patterns_congregation',
        columnNames: ['congregation_id'],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'pattern_phases',
        columns: [
          ...comunes,
          { name: 'pattern_id', type: uuid, isNullable: false },
          { name: 'name', type: 'text', isNullable: false },
          { name: 'position', type: 'int', isNullable: false },
        ],
        foreignKeys: [
          {
            columnNames: ['pattern_id'],
            referencedTableName: 'meeting_patterns',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'pattern_phases',
      new TableIndex({ name: 'IDX_pattern_phases_order', columnNames: ['pattern_id', 'position'] }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'meetings',
        columns: [
          ...comunes,
          { name: 'church_id', type: uuid, isNullable: false },
          { name: 'congregation_id', type: uuid, isNullable: false },
          { name: 'pattern_id', type: uuid, isNullable: true },
          { name: 'date', type: 'date', isNullable: false },
          { name: 'start_time', type: 'time', isNullable: false },
          { name: 'name', type: 'text', isNullable: false },
          { name: 'accent', type: 'text', isNullable: false, default: "'primary'" },
          { name: 'status', type: 'text', isNullable: false, default: "'programada'" },
          { name: 'notes', type: 'text', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'meetings',
      new TableIndex({ name: 'IDX_meetings_church_date', columnNames: ['church_id', 'date'] }),
    );
    await queryRunner.createIndex(
      'meetings',
      new TableIndex({
        name: 'IDX_meetings_congregation_date',
        columnNames: ['congregation_id', 'date'],
      }),
    );

    /*
     * Único **parcial**, y a mano porque TypeORM no genera el `WHERE`.
     *
     * Con `pattern_id IS NOT NULL` dos reuniones puntuales del mismo día no
     * chocan entre sí; con `deleted_at IS NULL`, cancelar un día y volver a
     * programarlo no tropieza con la fila borrada lógicamente. Lo que impide es
     * lo único que hay que impedir: que dos clics a la vez materialicen dos
     * veces la reunión del mismo patrón y el mismo día.
     */
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_meetings_pattern_date" ON "meetings" ("pattern_id", "date")
       WHERE "pattern_id" IS NOT NULL AND "deleted_at" IS NULL`,
    );

    await queryRunner.createTable(
      new Table({
        name: 'meeting_slots',
        columns: [
          ...comunes,
          { name: 'meeting_id', type: uuid, isNullable: false },
          { name: 'name', type: 'text', isNullable: false },
          { name: 'position', type: 'int', isNullable: false },
          { name: 'believer_id', type: uuid, isNullable: true },
          { name: 'note', type: 'text', isNullable: true },
        ],
        foreignKeys: [
          {
            columnNames: ['meeting_id'],
            referencedTableName: 'meetings',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'meeting_slots',
      new TableIndex({ name: 'IDX_meeting_slots_order', columnNames: ['meeting_id', 'position'] }),
    );
    await queryRunner.createIndex(
      'meeting_slots',
      new TableIndex({ name: 'IDX_meeting_slots_believer', columnNames: ['believer_id'] }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('meeting_slots', true);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_meetings_pattern_date"`);
    await queryRunner.dropTable('meetings', true);
    await queryRunner.dropTable('pattern_phases', true);
    await queryRunner.dropTable('meeting_patterns', true);
  }
}
