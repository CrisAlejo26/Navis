import {
  Table,
  TableForeignKey,
  TableIndex,
  type MigrationInterface,
  type QueryRunner,
} from 'typeorm';

/**
 * Tabla `profiles`: datos de dominio del usuario, enlazados con la tabla
 * `user` que crea Better Auth.
 *
 * IMPORTANTE: ejecuta antes `pnpm --filter @pastortools/api auth:migrate`,
 * porque esta migración declara una FK contra "user"("id").
 *
 * Escrita con la API de `Table` en vez de SQL literal para que valga tanto en
 * Postgres (modo compartido) como en SQLite (modo local, el de por defecto).
 */
export class CreateProfiles1785628800000 implements MigrationInterface {
  name = 'CreateProfiles1785628800000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';
    const timestamp = isPostgres ? 'timestamptz' : 'datetime';
    const now = isPostgres ? 'now()' : 'CURRENT_TIMESTAMP';

    if (!(await queryRunner.hasTable('user'))) {
      throw new Error(
        'No existe la tabla "user" de Better Auth. Ejecuta primero: pnpm --filter @pastortools/api auth:migrate',
      );
    }

    if (isPostgres) {
      await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
    }

    await queryRunner.createTable(
      new Table({
        name: 'profiles',
        columns: [
          {
            name: 'id',
            type: isPostgres ? 'uuid' : 'varchar',
            isPrimary: true,
            // En Postgres lo genera la base de datos; en SQLite, TypeORM.
            default: isPostgres ? 'gen_random_uuid()' : undefined,
          },
          { name: 'created_at', type: timestamp, isNullable: false, default: now },
          { name: 'updated_at', type: timestamp, isNullable: false, default: now },
          { name: 'deleted_at', type: timestamp, isNullable: true },
          { name: 'user_id', type: 'text', isNullable: false },
          { name: 'phone', type: 'text', isNullable: true },
          { name: 'church', type: 'text', isNullable: true },
          { name: 'avatar_url', type: 'text', isNullable: true },
          { name: 'bio', type: 'text', isNullable: true },
          { name: 'timezone', type: 'text', isNullable: false, default: "'Europe/Madrid'" },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'profiles',
      new TableIndex({ name: 'UQ_profiles_user_id', columnNames: ['user_id'], isUnique: true }),
    );

    await queryRunner.createForeignKey(
      'profiles',
      new TableForeignKey({
        name: 'FK_profiles_user',
        columnNames: ['user_id'],
        referencedTableName: 'user',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('profiles', true);
  }
}
