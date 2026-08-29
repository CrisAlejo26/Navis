import { Table, TableIndex, type MigrationInterface, type QueryRunner } from 'typeorm';

/**
 * El catálogo de **etiquetas de creyente** de cada iglesia y quién tiene cuál.
 *
 * Igual que `gifts` y `believer_gifts` (RFC 0003 §5.2), pero sin filas de
 * serie: cada iglesia crea las suyas —«En busca de trabajo», «Voluntario»…—.
 * La única diferencia con los dones es `featured` en la puente: la etiqueta
 * que sale en la tabla del listado, una por persona.
 */
export class CreateBelieverTags1790208000000 implements MigrationInterface {
  name = 'CreateBelieverTags1790208000000';

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
        name: 'believer_tags',
        columns: [
          ...comunes,
          { name: 'church_id', type: uuid, isNullable: false },
          { name: 'name', type: 'text', isNullable: false },
          { name: 'accent', type: 'text', isNullable: false, default: "'primary'" },
          { name: 'position', type: 'int', isNullable: false, default: 0 },
          { name: 'is_system', type: 'boolean', isNullable: false, default: false },
          { name: 'is_active', type: 'boolean', isNullable: false, default: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'believer_tags',
      new TableIndex({ name: 'IDX_believer_tags_church', columnNames: ['church_id'] }),
    );
    await queryRunner.createIndex(
      'believer_tags',
      new TableIndex({
        name: 'UQ_believer_tags_name',
        columnNames: ['church_id', 'name'],
        isUnique: true,
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'believer_tag_links',
        columns: [
          ...comunes,
          { name: 'believer_id', type: uuid, isNullable: false },
          { name: 'tag_id', type: uuid, isNullable: false },
          { name: 'featured', type: 'boolean', isNullable: false, default: false },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'believer_tag_links',
      new TableIndex({ name: 'IDX_believer_tag_links_tag', columnNames: ['tag_id'] }),
    );
    await queryRunner.createIndex(
      'believer_tag_links',
      new TableIndex({
        name: 'UQ_believer_tag_links',
        columnNames: ['believer_id', 'tag_id'],
        isUnique: true,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('believer_tag_links', true);
    await queryRunner.dropTable('believer_tags', true);
  }
}
