import { Table, TableIndex, type MigrationInterface, type QueryRunner } from 'typeorm';

/**
 * El núcleo mínimo de creyentes (RFC 0002 §6): lo justo para poder programar
 * un turno. La RFC 0003 continuará esta misma tabla añadiendo columnas —correo,
 * nacimiento, dirección, familia—, no creando otra.
 *
 * `user_id` nace nulable y única y hoy no la usa nadie: es lo que enlazará a
 * un creyente con su cuenta cuando toque avisarle de su turno.
 */
export class CreateBelievers1786320000000 implements MigrationInterface {
  name = 'CreateBelievers1786320000000';

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
        name: 'believers',
        columns: [
          ...comunes,
          { name: 'church_id', type: uuid, isNullable: false },
          { name: 'congregation_id', type: uuid, isNullable: true },
          { name: 'first_name', type: 'text', isNullable: false },
          { name: 'last_name', type: 'text', isNullable: false, default: "''" },
          { name: 'phone', type: 'text', isNullable: true },
          { name: 'is_active', type: 'boolean', isNullable: false, default: true },
          { name: 'user_id', type: 'text', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'believers',
      new TableIndex({ name: 'IDX_believers_church', columnNames: ['church_id'] }),
    );
    await queryRunner.createIndex(
      'believers',
      new TableIndex({ name: 'UQ_believers_user', columnNames: ['user_id'], isUnique: true }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'believer_ministries',
        columns: [
          ...comunes,
          { name: 'believer_id', type: uuid, isNullable: false },
          { name: 'ministry', type: 'text', isNullable: false },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'believer_ministries',
      new TableIndex({
        name: 'UQ_believer_ministries',
        columnNames: ['believer_id', 'ministry'],
        isUnique: true,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('believer_ministries', true);
    await queryRunner.dropTable('believers', true);
  }
}
