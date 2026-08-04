import { Table, TableIndex, type MigrationInterface, type QueryRunner } from 'typeorm';

/**
 * Las **sedes** de cada iglesia (RFC 0002 §5.1): Benidorm, Alicante, Elda.
 *
 * Cada iglesia sale de aquí con una, con su propio nombre y marcada por
 * defecto. Es lo que permite que `meetings.congregation_id` sea obligatorio y
 * que ninguna consulta tenga dos caminos (D12); mientras solo haya una, la
 * interfaz no la menciona.
 */
export class CreateCongregations1786233600000 implements MigrationInterface {
  name = 'CreateCongregations1786233600000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';
    const uuid = isPostgres ? 'uuid' : 'varchar';
    const timestamp = isPostgres ? 'timestamptz' : 'datetime';
    const now = isPostgres ? 'now()' : 'CURRENT_TIMESTAMP';
    const mark = (index: number) => (isPostgres ? `$${String(index)}` : '?');

    await queryRunner.createTable(
      new Table({
        name: 'congregations',
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
          { name: 'city', type: 'text', isNullable: true },
          { name: 'accent', type: 'text', isNullable: false, default: "'primary'" },
          { name: 'position', type: 'int', isNullable: false, default: 0 },
          { name: 'is_default', type: 'boolean', isNullable: false, default: false },
          { name: 'is_active', type: 'boolean', isNullable: false, default: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'congregations',
      new TableIndex({ name: 'IDX_congregations_church', columnNames: ['church_id'] }),
    );
    await queryRunner.createIndex(
      'congregations',
      new TableIndex({
        name: 'UQ_congregations_name',
        columnNames: ['church_id', 'name'],
        isUnique: true,
      }),
    );

    // Una sede por iglesia existente, con el nombre de la propia iglesia.
    const filas: unknown = await queryRunner.query(`SELECT "id", "name" FROM "churches"`);
    if (!Array.isArray(filas)) return;

    // `Array.isArray` deja los elementos como `any`; se vuelven a atar a
    // `unknown` para comprobarlos uno a uno (Regla 10).
    const iglesias: unknown[] = filas;

    for (const fila of iglesias) {
      if (!fila || typeof fila !== 'object') continue;
      const id = 'id' in fila && typeof fila.id === 'string' ? fila.id : null;
      const name = 'name' in fila && typeof fila.name === 'string' ? fila.name : 'Sede principal';
      if (!id) continue;

      await queryRunner.query(
        `INSERT INTO "congregations" ("id", "church_id", "name", "is_default", "position")
         VALUES (${mark(1)}, ${mark(2)}, ${mark(3)}, ${isPostgres ? 'true' : '1'}, 0)`,
        [crypto.randomUUID(), id, name],
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('congregations', true);
  }
}
