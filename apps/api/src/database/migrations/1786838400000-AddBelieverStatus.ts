import { TableColumn, TableIndex, type MigrationInterface, type QueryRunner } from 'typeorm';

/**
 * La ficha de un creyente crece (RFC 0003 §5.1): estado, nombre normalizado
 * para buscar, margen de aviso y la fecha de su última nota.
 *
 * `status` **sustituye** a `is_active` (D2): tener un booleano y un estado sería
 * tener dos fuentes de verdad que se desincronizan a la primera. El calendario
 * pasa a filtrar por `status IN ('activo','nuevo')`, que es lo que ya quería
 * decir.
 *
 * La normalización del nombre se escribe **aquí dentro** y no se importa de
 * `@navis/shared`: una migración que importa deja de estar congelada, y si
 * mañana cambia `toSearchName` esta migración crearía otra cosa en una base
 * nueva que en las que ya existen (ver CLAUDE.md).
 */
export class AddBelieverStatus1786838400000 implements MigrationInterface {
  name = 'AddBelieverStatus1786838400000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';
    const mark = (index: number) => (isPostgres ? `$${String(index)}` : '?');

    await queryRunner.addColumns('believers', [
      new TableColumn({ name: 'status', type: 'text', isNullable: false, default: "'activo'" }),
      new TableColumn({ name: 'search_name', type: 'text', isNullable: false, default: "''" }),
      new TableColumn({ name: 'alert_after_days', type: 'int', isNullable: true, default: 30 }),
      new TableColumn({ name: 'last_note_at', type: 'date', isNullable: true }),
    ]);

    // Quien estaba de baja pasa a `inactivo`; el resto se queda en el `activo`
    // que ya trae el valor por defecto.
    await queryRunner.query(
      `UPDATE "believers" SET "status" = 'inactivo' WHERE "is_active" = ${isPostgres ? 'false' : '0'}`,
    );

    const filas: unknown = await queryRunner.query(
      `SELECT "id", "first_name", "last_name" FROM "believers"`,
    );
    for (const fila of Array.isArray(filas) ? (filas as unknown[]) : []) {
      if (!fila || typeof fila !== 'object') continue;
      const id = 'id' in fila && typeof fila.id === 'string' ? fila.id : null;
      if (!id) continue;

      const nombre =
        'first_name' in fila && typeof fila.first_name === 'string' ? fila.first_name : '';
      const apellidos =
        'last_name' in fila && typeof fila.last_name === 'string' ? fila.last_name : '';

      await queryRunner.query(
        `UPDATE "believers" SET "search_name" = ${mark(1)} WHERE "id" = ${mark(2)}`,
        [normalize(`${nombre} ${apellidos}`), id],
      );
    }

    // En SQLite esto recrea la tabla; por eso el índice se crea DESPUÉS de
    // quitar la columna y no antes (se lo llevaría por delante).
    await queryRunner.dropColumn('believers', 'is_active');

    await queryRunner.createIndex(
      'believers',
      new TableIndex({
        name: 'IDX_believers_church_search',
        columnNames: ['church_id', 'search_name'],
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    await queryRunner.dropIndex('believers', 'IDX_believers_church_search');
    await queryRunner.addColumn(
      'believers',
      new TableColumn({ name: 'is_active', type: 'boolean', isNullable: false, default: true }),
    );
    await queryRunner.query(
      `UPDATE "believers" SET "is_active" = ${isPostgres ? 'false' : '0'}
       WHERE "status" IN ('inactivo', 'trasladado')`,
    );
    await queryRunner.dropColumns('believers', [
      'status',
      'search_name',
      'alert_after_days',
      'last_note_at',
    ]);
  }
}

/** `Jesús Peña` → `jesus pena`. Congelada a propósito: ver la cabecera. */
function normalize(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}
