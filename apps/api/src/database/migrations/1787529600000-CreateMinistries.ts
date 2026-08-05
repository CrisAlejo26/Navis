import { Table, TableIndex, type MigrationInterface, type QueryRunner } from 'typeorm';

/**
 * El catálogo de **labores** por iglesia.
 *
 * Antes las labores eran los `slug` de los **roles**, porque parecían la misma
 * lista. No lo son: «ofrenda» o «profecía por primera vez» son labores de
 * verdad y no roles de nadie, así que no cabían en ningún sitio.
 *
 * **No toca `believer_ministries`, y ahí está la gracia**: lo que guarda cada
 * persona sigue siendo el `slug`, y el calendario sigue casando por él contra
 * `calendars.ministry`. Esta tabla solo dice cómo se llama, de qué color es y
 * en qué orden va cada slug. Nada de lo programado se mueve.
 *
 * Tampoco siembra nada: el catálogo lo crea `MinistriesService.ensureFor` a la
 * primera consulta, igual que el de dones, para que una iglesia creada después
 * de esta migración no nazca sin ninguna.
 */
export class CreateMinistries1787529600000 implements MigrationInterface {
  name = 'CreateMinistries1787529600000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';
    const uuid = isPostgres ? 'uuid' : 'varchar';
    const timestamp = isPostgres ? 'timestamptz' : 'datetime';
    const now = isPostgres ? 'now()' : 'CURRENT_TIMESTAMP';

    await queryRunner.createTable(
      new Table({
        name: 'ministries',
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
          { name: 'slug', type: 'text', isNullable: false },
          { name: 'name', type: 'text', isNullable: false },
          { name: 'accent', type: 'text', isNullable: false, default: "'primary'" },
          { name: 'position', type: 'int', isNullable: false, default: 0 },
          { name: 'is_system', type: 'boolean', isNullable: false, default: false },
          { name: 'is_active', type: 'boolean', isNullable: false, default: true },
        ],
        foreignKeys: [
          {
            columnNames: ['church_id'],
            referencedTableName: 'churches',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'ministries',
      new TableIndex({ name: 'IDX_ministries_church', columnNames: ['church_id'] }),
    );
    await queryRunner.createIndex(
      'ministries',
      new TableIndex({
        name: 'UQ_ministries_slug',
        columnNames: ['church_id', 'slug'],
        isUnique: true,
      }),
    );
    await queryRunner.createIndex(
      'ministries',
      new TableIndex({
        name: 'UQ_ministries_name',
        columnNames: ['church_id', 'name'],
        isUnique: true,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('ministries', true);
  }
}
