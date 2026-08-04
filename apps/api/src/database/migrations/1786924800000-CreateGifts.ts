import { Table, TableIndex, type MigrationInterface, type QueryRunner } from 'typeorm';

/**
 * El catálogo de **dones** de cada iglesia y quién tiene cuál (RFC 0003 §5.2).
 *
 * Los siete de serie se siembran aquí para las iglesias que ya existen; las que
 * se creen después los reciben de `GiftsService.ensureFor()`, que es el mismo
 * patrón que `CongregationsService.ensureFor()`: una iglesia nueva no puede
 * nacer sin catálogo, y resolverlo en el servicio evita invertir la dependencia
 * entre módulos.
 *
 * La lista y los colores van escritos **aquí dentro** y no importados de
 * `@navis/shared`: una migración que importa deja de estar congelada.
 */
const DE_SERIE = [
  { name: 'Profecía', accent: '#6d28d9' },
  { name: 'Imposición de manos', accent: '#0891b2' },
  { name: 'Bautismo con el Espíritu Santo', accent: '#2140cf' },
  { name: 'Sanidad', accent: '#16a34a' },
  { name: 'Echar fuera demonios', accent: '#dc2626' },
  { name: 'Sabiduría', accent: '#ca8a04' },
  { name: 'Discernimiento', accent: '#0d9488' },
] as const;

export class CreateGifts1786924800000 implements MigrationInterface {
  name = 'CreateGifts1786924800000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';
    const uuid = isPostgres ? 'uuid' : 'varchar';
    const timestamp = isPostgres ? 'timestamptz' : 'datetime';
    const now = isPostgres ? 'now()' : 'CURRENT_TIMESTAMP';
    const mark = (index: number) => (isPostgres ? `$${String(index)}` : '?');
    const cierto = isPostgres ? 'true' : '1';

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
        name: 'gifts',
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
      'gifts',
      new TableIndex({ name: 'IDX_gifts_church', columnNames: ['church_id'] }),
    );
    await queryRunner.createIndex(
      'gifts',
      new TableIndex({ name: 'UQ_gifts_name', columnNames: ['church_id', 'name'], isUnique: true }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'believer_gifts',
        columns: [
          ...comunes,
          { name: 'believer_id', type: uuid, isNullable: false },
          { name: 'gift_id', type: uuid, isNullable: false },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'believer_gifts',
      new TableIndex({ name: 'IDX_believer_gifts_gift', columnNames: ['gift_id'] }),
    );
    await queryRunner.createIndex(
      'believer_gifts',
      new TableIndex({
        name: 'UQ_believer_gifts',
        columnNames: ['believer_id', 'gift_id'],
        isUnique: true,
      }),
    );

    const filas: unknown = await queryRunner.query(`SELECT "id" FROM "churches"`);
    for (const fila of Array.isArray(filas) ? (filas as unknown[]) : []) {
      if (!fila || typeof fila !== 'object') continue;
      const churchId = 'id' in fila && typeof fila.id === 'string' ? fila.id : null;
      if (!churchId) continue;

      for (const [position, don] of DE_SERIE.entries()) {
        await queryRunner.query(
          `INSERT INTO "gifts" ("id", "church_id", "name", "accent", "position", "is_system")
           VALUES (${mark(1)}, ${mark(2)}, ${mark(3)}, ${mark(4)}, ${mark(5)}, ${cierto})`,
          [crypto.randomUUID(), churchId, don.name, don.accent, position],
        );
      }
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('believer_gifts', true);
    await queryRunner.dropTable('gifts', true);
  }
}
