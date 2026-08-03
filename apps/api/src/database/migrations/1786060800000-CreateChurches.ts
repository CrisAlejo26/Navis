import { toSlug } from '@navis/shared';
import { Table, TableColumn, TableIndex, type MigrationInterface, type QueryRunner } from 'typeorm';

/**
 * Las iglesias como espacio de trabajo (RFC 0008): tablas `churches` y
 * `church_members`, y la iglesia activa en el perfil.
 *
 * La activa va en `profiles` y no en la tabla `user`: esa la gestiona Better
 * Auth, que cachea la sesión en una cookie durante cinco minutos, así que un
 * cambio de iglesia tardaría ese rato en notarse.
 *
 * Además **traspasa lo que ya hay**: una instalación en marcha se queda con una
 * iglesia —la del texto suelto de `profiles.church`— y todas sus cuentas
 * dentro. Sin esto, quien ya usaba Navis se encontraría de golpe sin acceso a
 * sus propios datos.
 */
export class CreateChurches1786060800000 implements MigrationInterface {
  name = 'CreateChurches1786060800000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';
    const uuid = isPostgres ? 'uuid' : 'varchar';
    const timestamp = isPostgres ? 'timestamptz' : 'datetime';
    const now = isPostgres ? 'now()' : 'CURRENT_TIMESTAMP';
    const mark = (index: number) => (isPostgres ? `$${String(index)}` : '?');

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
        name: 'churches',
        columns: [
          ...comunes,
          { name: 'name', type: 'text', isNullable: false },
          { name: 'slug', type: 'text', isNullable: false },
          // Nula solo para lo que venga del traspaso: el alta la exige.
          { name: 'city', type: 'text', isNullable: true },
          { name: 'timezone', type: 'text', isNullable: false, default: "'Europe/Madrid'" },
          { name: 'owner_id', type: 'text', isNullable: false },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'churches',
      new TableIndex({ name: 'UQ_churches_slug', columnNames: ['slug'], isUnique: true }),
    );
    await queryRunner.createIndex(
      'churches',
      new TableIndex({ name: 'IDX_churches_owner', columnNames: ['owner_id'] }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'church_members',
        columns: [
          ...comunes,
          { name: 'church_id', type: uuid, isNullable: false },
          { name: 'user_id', type: 'text', isNullable: false },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'church_members',
      new TableIndex({
        name: 'UQ_church_members',
        columnNames: ['church_id', 'user_id'],
        isUnique: true,
      }),
    );
    await queryRunner.createIndex(
      'church_members',
      new TableIndex({ name: 'IDX_church_members_user', columnNames: ['user_id'] }),
    );

    await queryRunner.addColumn(
      'profiles',
      new TableColumn({ name: 'active_church_id', type: uuid, isNullable: true }),
    );

    // --- Traspaso de la instalación que ya estuviera en marcha ---------------

    if (!(await queryRunner.hasTable('user'))) return;

    const usuarios: unknown = await queryRunner.query(
      `SELECT "id" FROM "user" ORDER BY "createdAt" ASC`,
    );
    if (!Array.isArray(usuarios) || usuarios.length === 0) return;

    const ids = usuarios
      .map((fila: unknown) =>
        fila && typeof fila === 'object' && 'id' in fila && typeof fila.id === 'string'
          ? fila.id
          : null,
      )
      .filter((id): id is string => id !== null);
    const dueño = ids[0];
    if (!dueño) return;

    const nombres: unknown = await queryRunner.query(
      `SELECT "church" FROM "profiles" WHERE "church" IS NOT NULL AND "church" <> '' LIMIT 1`,
    );
    const primera: unknown = Array.isArray(nombres) ? nombres[0] : undefined;
    const nombre =
      primera && typeof primera === 'object' && 'church' in primera
        ? typeof primera.church === 'string'
          ? primera.church
          : 'Mi iglesia'
        : 'Mi iglesia';

    const churchId = crypto.randomUUID();
    await queryRunner.query(
      `INSERT INTO "churches" ("id", "name", "slug", "owner_id")
       VALUES (${mark(1)}, ${mark(2)}, ${mark(3)}, ${mark(4)})`,
      [churchId, nombre, toSlug(nombre) || 'mi-iglesia', dueño],
    );

    for (const id of ids) {
      await queryRunner.query(
        `INSERT INTO "church_members" ("id", "church_id", "user_id")
         VALUES (${mark(1)}, ${mark(2)}, ${mark(3)})`,
        [crypto.randomUUID(), churchId, id],
      );
      await queryRunner.query(
        `UPDATE "profiles" SET "active_church_id" = ${mark(1)} WHERE "user_id" = ${mark(2)}`,
        [churchId, id],
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('profiles', 'active_church_id');
    await queryRunner.dropTable('church_members', true);
    await queryRunner.dropTable('churches', true);
  }
}
