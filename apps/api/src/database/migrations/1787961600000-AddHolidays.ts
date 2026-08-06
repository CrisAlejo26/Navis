import { Table, TableColumn, TableIndex, type MigrationInterface, type QueryRunner } from 'typeorm';

/**
 * Los festivos del calendario (RFC 0011): de dónde son y dónde se guardan.
 *
 * Dos cosas y una tabla nueva:
 *
 * - **La iglesia dice de dónde es.** `country` con `ES` por defecto —es donde
 *   están las iglesias de hoy y un calendario sin país no marca nada— y
 *   `region` nula, porque adivinar la comunidad por la ciudad es acertar a
 *   medias y un festivo de otra comunidad es peor que ninguno.
 *
 * - **`holiday_cache` es una caché y nada más.** Se puede vaciar entera sin
 *   perder un dato del negocio: se rellena sola la próxima vez que alguien abra
 *   ese mes. Por eso no lleva `church_id` —los festivos de un país son los
 *   mismos para todas— y por eso el `down` la tira sin miramientos.
 *
 * `uuid` en la clave primaria no vale en SQLite, que no tiene ese tipo: es la
 * misma rama por motor que ya hacen las migraciones anteriores.
 */
export class AddHolidays1787961600000 implements MigrationInterface {
  name = 'AddHolidays1787961600000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';
    const uuid = isPostgres ? 'uuid' : 'varchar';
    const timestamp = isPostgres ? 'timestamptz' : 'datetime';
    const now = isPostgres ? 'now()' : 'CURRENT_TIMESTAMP';

    await queryRunner.addColumns('churches', [
      new TableColumn({ name: 'country', type: 'text', isNullable: false, default: "'ES'" }),
      new TableColumn({ name: 'region', type: 'text', isNullable: true }),
    ]);

    await queryRunner.createTable(
      new Table({
        name: 'holiday_cache',
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
          { name: 'country', type: 'text', isNullable: false },
          { name: 'year', type: 'int', isNullable: false },
          { name: 'payload', type: 'text', isNullable: false },
          { name: 'fetched_at', type: timestamp, isNullable: false },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'holiday_cache',
      new TableIndex({
        name: 'UQ_holiday_cache',
        columnNames: ['country', 'year'],
        isUnique: true,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('holiday_cache', true);
    await queryRunner.dropColumns('churches', ['country', 'region']);
  }
}
