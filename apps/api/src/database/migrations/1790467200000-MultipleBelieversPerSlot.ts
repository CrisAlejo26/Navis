import { Table, TableIndex, type MigrationInterface, type QueryRunner } from 'typeorm';

/**
 * Varias personas por fase: `meeting_slots.believer_id` pasa a la tabla de
 * unión `meeting_slot_believers`, con el orden en `position`.
 *
 * Los datos se copian **antes** de quitar la columna: cada `believer_id` no
 * nulo se convierte en una fila con `position` 0. `believer_id` va sin clave
 * ajena, como en las filas de las tablas vinculadas: el borrado de creyentes es
 * lógico y el historial sigue contando.
 *
 * Al quitar la columna en SQLite TypeORM recrea la tabla y vuelve a poner los
 * índices que quedaban, así que el de `believer_id` se borra **antes**.
 */
export class MultipleBelieversPerSlot1790467200000 implements MigrationInterface {
    name = 'MultipleBelieversPerSlot1790467200000';

    async up(queryRunner: QueryRunner): Promise<void> {
        const isPostgres = queryRunner.connection.options.type === 'postgres';
        const uuid = isPostgres ? 'uuid' : 'varchar';
        const timestamp = isPostgres ? 'timestamptz' : 'datetime';
        const now = isPostgres ? 'now()' : 'CURRENT_TIMESTAMP';

        await queryRunner.createTable(
            new Table({
                name: 'meeting_slot_believers',
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
                    { name: 'slot_id', type: uuid, isNullable: false },
                    { name: 'believer_id', type: uuid, isNullable: false },
                    { name: 'position', type: 'int', isNullable: false },
                ],
                foreignKeys: [
                    {
                        columnNames: ['slot_id'],
                        referencedTableName: 'meeting_slots',
                        referencedColumnNames: ['id'],
                        onDelete: 'CASCADE',
                    },
                ],
            }),
            true,
        );
        await queryRunner.createIndex(
            'meeting_slot_believers',
            new TableIndex({
                name: 'IDX_meeting_slot_believers_slot',
                columnNames: ['slot_id', 'position'],
            }),
        );
        await queryRunner.createIndex(
            'meeting_slot_believers',
            new TableIndex({
                name: 'IDX_meeting_slot_believers_believer',
                columnNames: ['believer_id'],
            }),
        );

        // El id de la fila nueva se genera en el motor: uuid nativo en Postgres y
        // un uuid v4 armado a mano en SQLite, que no tiene función para ello.
        const newId = isPostgres
            ? 'gen_random_uuid()'
            : `lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6)))`;
        await queryRunner.query(
            `INSERT INTO "meeting_slot_believers" ("id", "slot_id", "believer_id", "position")
             SELECT ${newId}, "id", "believer_id", 0 FROM "meeting_slots"
             WHERE "believer_id" IS NOT NULL`,
        );

        await queryRunner.dropIndex('meeting_slots', 'IDX_meeting_slots_believer');
        await queryRunner.dropColumn('meeting_slots', 'believer_id');
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        const isPostgres = queryRunner.connection.options.type === 'postgres';
        await queryRunner.query(
            `ALTER TABLE "meeting_slots" ADD COLUMN "believer_id" ${isPostgres ? 'uuid' : 'varchar'}`,
        );
        // Solo cabe una persona por fase: la primera. Las demás se pierden al bajar.
        await queryRunner.query(
            `UPDATE "meeting_slots" SET "believer_id" = (
                 SELECT "believer_id" FROM "meeting_slot_believers" sb
                 WHERE sb."slot_id" = "meeting_slots"."id" ORDER BY sb."position" LIMIT 1)`,
        );
        await queryRunner.createIndex(
            'meeting_slots',
            new TableIndex({ name: 'IDX_meeting_slots_believer', columnNames: ['believer_id'] }),
        );
        await queryRunner.dropTable('meeting_slot_believers', true);
    }
}
