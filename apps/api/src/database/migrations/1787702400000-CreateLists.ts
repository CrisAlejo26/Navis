import { Table, TableIndex, type MigrationInterface, type QueryRunner } from 'typeorm';

/**
 * Las **listas compartidas** (RFC 0010): la lista, sus miembros, el directorio
 * de accesos, las concesiones, las visitas y los intentos.
 *
 * Siembra las cinco de serie en cada iglesia que ya exista, y las escribe **a
 * mano, sin importar ninguna constante**: es la trampa de `CreateRoles` que ya
 * está en `CLAUDE.md` —una migración que importa de `@navis/shared` no está
 * congelada y cambia con la constante—. Lo que crea aquí tiene que seguir
 * siendo lo mismo dentro de dos años.
 *
 * El color de cada una es **el de su labor** en el catálogo de esa iglesia,
 * para que «Púlpito» sea del mismo color en el calendario, en la etiqueta de un
 * creyente y en su lista (D4). Como eso se lee de la base de datos,
 * `queryRunner.query` devuelve `any` y **se comprueba antes de usarlo**
 * (Regla 10); si la labor no está, se cae al color de la paleta que le toca por
 * posición.
 */
const LISTAS = [
  { name: 'Púlpito', slug: 'pulpito', ministry: 'pulpito', accent: '#2140cf' },
  { name: 'Recepción', slug: 'recepcion', ministry: 'recepcion', accent: '#0891b2' },
  { name: 'Sonido', slug: 'sonido', ministry: 'sonido', accent: '#16a34a' },
  { name: 'Biblias', slug: 'biblias', ministry: 'biblias', accent: '#ca8a04' },
  { name: 'Ofrenda', slug: 'ofrenda', ministry: 'ofrenda', accent: '#9333ea' },
] as const;

/**
 * Las filas de un `SELECT`, como lo que son: cosas desconocidas.
 *
 * `Array.isArray` sobre un `unknown` lo estrecha a `any[]`, que es justo el
 * `any` que la Regla 10 no quiere. Con este predicado el elemento sale `unknown`
 * y hay que comprobarlo antes de leerle nada.
 */
function isRows(value: unknown): value is readonly unknown[] {
  return Array.isArray(value);
}

/** El texto de esa propiedad, o `null` si no está o no es texto. */
function text(row: unknown, key: string): string | null {
  if (!row || typeof row !== 'object' || !(key in row)) return null;

  const value: unknown = Reflect.get(row, key);
  return typeof value === 'string' ? value : null;
}

/** `{ [slug]: accent }` de las labores de una iglesia, ya comprobado. */
function ministryAccents(filas: unknown): Map<string, string> {
  const accents = new Map<string, string>();
  if (!isRows(filas)) return accents;

  for (const fila of filas) {
    const slug = text(fila, 'slug');
    const accent = text(fila, 'accent');
    if (slug && accent) accents.set(slug, accent);
  }

  return accents;
}

function churchIds(filas: unknown): string[] {
  if (!isRows(filas)) return [];

  return filas.flatMap((fila) => {
    const id = text(fila, 'id');
    return id ? [id] : [];
  });
}

export class CreateLists1787702400000 implements MigrationInterface {
  name = 'CreateLists1787702400000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';
    const uuid = isPostgres ? 'uuid' : 'varchar';
    const timestamp = isPostgres ? 'timestamptz' : 'datetime';
    const now = isPostgres ? 'now()' : 'CURRENT_TIMESTAMP';
    const mark = (index: number) => (isPostgres ? `$${String(index)}` : '?');

    const base = [
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
        name: 'lists',
        columns: [
          ...base,
          { name: 'church_id', type: uuid, isNullable: false },
          { name: 'name', type: 'text', isNullable: false },
          { name: 'slug', type: 'text', isNullable: false },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'accent', type: 'text', isNullable: false, default: "'primary'" },
          { name: 'position', type: 'int', isNullable: false, default: 0 },
          { name: 'is_active', type: 'boolean', isNullable: false, default: true },
          { name: 'visibility', type: 'text', isNullable: false, default: "'private'" },
          { name: 'share_token', type: 'text', isNullable: true },
          { name: 'shared_at', type: timestamp, isNullable: true },
          { name: 'share_expires_at', type: timestamp, isNullable: true },
          { name: 'public_fields', type: 'text', isNullable: false, default: "'{}'" },
          { name: 'allow_download', type: 'boolean', isNullable: false, default: true },
          { name: 'cover_key', type: 'text', isNullable: true },
          { name: 'created_by', type: 'text', isNullable: true },
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

    for (const index of [
      new TableIndex({ name: 'IDX_lists_church', columnNames: ['church_id'] }),
      new TableIndex({ name: 'UQ_lists_slug', columnNames: ['church_id', 'slug'], isUnique: true }),
      new TableIndex({ name: 'UQ_lists_name', columnNames: ['church_id', 'name'], isUnique: true }),
      // El token es único de verdad: es lo que resuelve `/l/<token>` sin filtrar
      // por iglesia. Los nulos no chocan entre sí en ninguno de los dos motores.
      new TableIndex({ name: 'UQ_lists_token', columnNames: ['share_token'], isUnique: true }),
    ]) {
      await queryRunner.createIndex('lists', index);
    }

    await queryRunner.createTable(
      new Table({
        name: 'list_members',
        columns: [
          { name: 'list_id', type: uuid, isPrimary: true },
          { name: 'believer_id', type: uuid, isPrimary: true },
          { name: 'position', type: 'int', isNullable: false, default: 0 },
          { name: 'note', type: 'text', isNullable: true },
          { name: 'added_at', type: timestamp, isNullable: false, default: now },
          { name: 'added_by', type: 'text', isNullable: false },
        ],
        foreignKeys: [
          {
            columnNames: ['list_id'],
            referencedTableName: 'lists',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['believer_id'],
            referencedTableName: 'believers',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'list_members',
      new TableIndex({ name: 'IDX_list_members_order', columnNames: ['list_id', 'position'] }),
    );
    // Por aquí se pregunta «¿en qué listas está esta persona?» (§6.2).
    await queryRunner.createIndex(
      'list_members',
      new TableIndex({ name: 'IDX_list_members_believer', columnNames: ['believer_id'] }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'list_viewers',
        columns: [
          ...base,
          { name: 'church_id', type: uuid, isNullable: false },
          { name: 'believer_id', type: uuid, isNullable: true },
          { name: 'username', type: 'text', isNullable: false },
          { name: 'password_hash', type: 'text', isNullable: false },
          { name: 'label', type: 'text', isNullable: false },
          { name: 'is_active', type: 'boolean', isNullable: false, default: true },
          { name: 'expires_at', type: timestamp, isNullable: true },
          { name: 'sessions_valid_from', type: timestamp, isNullable: false, default: now },
          { name: 'last_seen_at', type: timestamp, isNullable: true },
          { name: 'created_by', type: 'text', isNullable: false },
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

    for (const index of [
      new TableIndex({ name: 'IDX_list_viewers_church', columnNames: ['church_id'] }),
      new TableIndex({
        name: 'UQ_list_viewers_username',
        columnNames: ['church_id', 'username'],
        isUnique: true,
      }),
      // Índice plano: como los nulos no chocan entre sí, da a la vez «un acceso
      // por creyente» y «tantos accesos de grupo como haga falta» (D20).
      new TableIndex({
        name: 'UQ_list_viewers_believer',
        columnNames: ['church_id', 'believer_id'],
        isUnique: true,
      }),
    ]) {
      await queryRunner.createIndex('list_viewers', index);
    }

    await queryRunner.createTable(
      new Table({
        name: 'list_grants',
        columns: [
          { name: 'viewer_id', type: uuid, isPrimary: true },
          { name: 'list_id', type: uuid, isPrimary: true },
          { name: 'granted_at', type: timestamp, isNullable: false, default: now },
          { name: 'granted_by', type: 'text', isNullable: false },
        ],
        foreignKeys: [
          {
            columnNames: ['viewer_id'],
            referencedTableName: 'list_viewers',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['list_id'],
            referencedTableName: 'lists',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'list_grants',
      new TableIndex({ name: 'IDX_list_grants_list', columnNames: ['list_id'] }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'list_views',
        columns: [
          {
            name: 'id',
            type: uuid,
            isPrimary: true,
            default: isPostgres ? 'gen_random_uuid()' : undefined,
          },
          { name: 'list_id', type: uuid, isNullable: false },
          { name: 'viewer_id', type: uuid, isNullable: true },
          { name: 'viewed_at', type: timestamp, isNullable: false, default: now },
          { name: 'visitor_hash', type: 'text', isNullable: false },
          { name: 'ip_prefix', type: 'text', isNullable: false, default: "''" },
          { name: 'device', type: 'text', isNullable: false, default: "'desktop'" },
          { name: 'platform', type: 'text', isNullable: true },
          { name: 'referrer_host', type: 'text', isNullable: true },
          { name: 'views', type: 'int', isNullable: false, default: 1 },
        ],
        foreignKeys: [
          {
            columnNames: ['list_id'],
            referencedTableName: 'lists',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // La consulta de la estela: los últimos treinta días de una lista (§6.5).
    await queryRunner.createIndex(
      'list_views',
      new TableIndex({ name: 'IDX_list_views_recent', columnNames: ['list_id', 'viewed_at'] }),
    );
    await queryRunner.createIndex(
      'list_views',
      new TableIndex({ name: 'IDX_list_views_visitor', columnNames: ['visitor_hash'] }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'list_access_log',
        columns: [
          {
            name: 'id',
            type: uuid,
            isPrimary: true,
            default: isPostgres ? 'gen_random_uuid()' : undefined,
          },
          { name: 'list_id', type: uuid, isNullable: false },
          { name: 'viewer_id', type: uuid, isNullable: true },
          { name: 'username', type: 'text', isNullable: false },
          { name: 'outcome', type: 'text', isNullable: false },
          { name: 'ip_prefix', type: 'text', isNullable: false, default: "''" },
          { name: 'at', type: timestamp, isNullable: false, default: now },
        ],
        foreignKeys: [
          {
            columnNames: ['list_id'],
            referencedTableName: 'lists',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'list_access_log',
      new TableIndex({ name: 'IDX_list_access_log_recent', columnNames: ['list_id', 'at'] }),
    );

    // Las cinco de serie, en cada iglesia que ya exista, vacías y sin publicar.
    // `queryRunner.query` devuelve `any` y no acepta genérico: lo que sale se
    // recoge como `unknown` y se comprueba antes de usarlo (Regla 10).
    const iglesias: unknown = await queryRunner.query(`SELECT "id" FROM "churches"`);

    for (const churchId of churchIds(iglesias)) {
      const labores: unknown = await queryRunner.query(
        `SELECT "slug", "accent" FROM "ministries" WHERE "church_id" = ${mark(1)}`,
        [churchId],
      );
      const accents = ministryAccents(labores);

      for (const [position, lista] of LISTAS.entries()) {
        await queryRunner.query(
          `INSERT INTO "lists" ("id", "church_id", "name", "slug", "accent", "position")
           VALUES (${mark(1)}, ${mark(2)}, ${mark(3)}, ${mark(4)}, ${mark(5)}, ${mark(6)})`,
          [
            crypto.randomUUID(),
            churchId,
            lista.name,
            lista.slug,
            accents.get(lista.ministry) ?? lista.accent,
            position,
          ],
        );
      }
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('list_access_log', true);
    await queryRunner.dropTable('list_views', true);
    await queryRunner.dropTable('list_grants', true);
    await queryRunner.dropTable('list_viewers', true);
    await queryRunner.dropTable('list_members', true);
    await queryRunner.dropTable('lists', true);
  }
}
