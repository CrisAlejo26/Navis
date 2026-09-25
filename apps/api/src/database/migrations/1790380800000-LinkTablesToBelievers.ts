import { TableColumn, TableIndex, type MigrationInterface, type QueryRunner } from 'typeorm';

/**
 * Las **tablas vinculadas a creyentes** (RFC 0025): el origen de las filas de
 * una tabla (`source`), el campo del creyente que rellena cada columna
 * (`believer_field`) y el enlace de cada fila (`believer_id`).
 *
 * `believer_id` va **sin clave ajena** a propósito (D15): el borrado de
 * creyentes es lógico y la fila con sus columnas a mano sigue teniendo sentido
 * aunque la referencia quede fría. El índice único es **parcial** (D9), como
 * ya lo son los de `custom_tables` (PartialUniqueSlugs): excluye las filas
 * borradas y las hechas a mano, que no llevan `believer_id`.
 */
export class LinkTablesToBelievers1790380800000 implements MigrationInterface {
    name = 'LinkTablesToBelievers1790380800000';

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            'custom_tables',
            new TableColumn({ name: 'source', type: 'text', isNullable: true }),
        );
        await queryRunner.addColumn(
            'custom_table_columns',
            new TableColumn({ name: 'believer_field', type: 'text', isNullable: true }),
        );
        await queryRunner.addColumn(
            'custom_table_rows',
            new TableColumn({
                name: 'believer_id',
                type: queryRunner.connection.options.type === 'postgres' ? 'uuid' : 'varchar',
                isNullable: true,
            }),
        );
        await queryRunner.createIndex(
            'custom_table_rows',
            new TableIndex({
                name: 'UQ_custom_table_rows_believer',
                columnNames: ['table_id', 'believer_id'],
                isUnique: true,
                where: WHERE,
            }),
        );
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropIndex('custom_table_rows', 'UQ_custom_table_rows_believer');
        await queryRunner.dropColumn('custom_table_rows', 'believer_id');
        await queryRunner.dropColumn('custom_table_columns', 'believer_field');
        await queryRunner.dropColumn('custom_tables', 'source');
    }
}

const WHERE = '"deleted_at" IS NULL AND "believer_id" IS NOT NULL';
