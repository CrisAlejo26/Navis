import { Table, TableIndex, type MigrationInterface, type QueryRunner } from 'typeorm';

/**
 * Comunicaciones (RFC 0016): canales, sus miembros, los mensajes, sus
 * adjuntos y las reacciones.
 *
 * Mismo patrón que `CreateLists`: la `Table` API de TypeORM, resuelto a mano
 * para SQLite y Postgres. `channel_members` lleva los tres cursores por
 * persona (`last_read_at`, `archived_at`, `cleared_at`) en vez de tablas
 * nuevas — es el mismo patrón ya validado por RFC 0006 y ampliado por RFC
 * 0016 §3 — y `messages.reply_to_id`/`forwarded_from_id` son `SET NULL`: si
 * el original desaparece, la cita o el reenvío siguen leyéndose (D4).
 */
export class CreateChat1788393600000 implements MigrationInterface {
  name = 'CreateChat1788393600000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';
    const uuid = isPostgres ? 'uuid' : 'varchar';
    const timestamp = isPostgres ? 'timestamptz' : 'datetime';
    const now = isPostgres ? 'now()' : 'CURRENT_TIMESTAMP';

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
        name: 'channels',
        columns: [
          ...base,
          { name: 'church_id', type: uuid, isNullable: false },
          { name: 'kind', type: 'text', isNullable: false },
          { name: 'name', type: 'text', isNullable: true },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'photo_key', type: 'text', isNullable: true },
          { name: 'is_archived', type: 'boolean', isNullable: false, default: false },
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

    await queryRunner.createIndex(
      'channels',
      new TableIndex({ name: 'IDX_channels_church', columnNames: ['church_id'] }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'channel_members',
        columns: [
          ...base,
          { name: 'channel_id', type: uuid, isNullable: false },
          { name: 'user_id', type: 'text', isNullable: false },
          { name: 'role', type: 'text', isNullable: false, default: "'miembro'" },
          { name: 'last_read_at', type: timestamp, isNullable: false, default: now },
          { name: 'archived_at', type: timestamp, isNullable: true },
          { name: 'cleared_at', type: timestamp, isNullable: true },
          { name: 'muted_until', type: timestamp, isNullable: true },
        ],
        foreignKeys: [
          {
            columnNames: ['channel_id'],
            referencedTableName: 'channels',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    for (const index of [
      new TableIndex({
        name: 'UQ_channel_members',
        columnNames: ['channel_id', 'user_id'],
        isUnique: true,
      }),
      // Por aquí se resuelve «¿en qué canales está esta cuenta?» sin recorrer
      // cada canal (chat-participants.service.ts).
      new TableIndex({ name: 'IDX_channel_members_user', columnNames: ['user_id'] }),
    ]) {
      await queryRunner.createIndex('channel_members', index);
    }

    await queryRunner.createTable(
      new Table({
        name: 'messages',
        columns: [
          ...base,
          { name: 'channel_id', type: uuid, isNullable: false },
          { name: 'author_id', type: 'text', isNullable: false },
          { name: 'body', type: 'text', isNullable: true },
          { name: 'reply_to_id', type: uuid, isNullable: true },
          { name: 'forwarded_from_id', type: uuid, isNullable: true },
          { name: 'edited_at', type: timestamp, isNullable: true },
        ],
        foreignKeys: [
          {
            columnNames: ['channel_id'],
            referencedTableName: 'channels',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['reply_to_id'],
            referencedTableName: 'messages',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
          {
            columnNames: ['forwarded_from_id'],
            referencedTableName: 'messages',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
        ],
      }),
      true,
    );

    // El cursor del historial (§3): "los N mensajes antes de X", nunca LIMIT/OFFSET.
    await queryRunner.createIndex(
      'messages',
      new TableIndex({ name: 'IDX_messages_channel', columnNames: ['channel_id', 'created_at'] }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'message_attachments',
        columns: [
          ...base,
          { name: 'message_id', type: uuid, isNullable: false },
          { name: 'kind', type: 'text', isNullable: false },
          { name: 'storage_key', type: 'text', isNullable: false },
          { name: 'original_name', type: 'text', isNullable: false },
          { name: 'mime_type', type: 'text', isNullable: false },
          { name: 'size_bytes', type: 'int', isNullable: false },
        ],
        foreignKeys: [
          {
            columnNames: ['message_id'],
            referencedTableName: 'messages',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'message_attachments',
      new TableIndex({ name: 'IDX_message_attachments_message', columnNames: ['message_id'] }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'message_reactions',
        columns: [
          { name: 'message_id', type: uuid, isPrimary: true },
          { name: 'user_id', type: 'text', isPrimary: true },
          { name: 'emoji', type: 'text', isPrimary: true },
          { name: 'created_at', type: timestamp, isNullable: false, default: now },
        ],
        foreignKeys: [
          {
            columnNames: ['message_id'],
            referencedTableName: 'messages',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'message_reactions',
      new TableIndex({ name: 'IDX_message_reactions_user', columnNames: ['user_id'] }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('message_reactions', true);
    await queryRunner.dropTable('message_attachments', true);
    await queryRunner.dropTable('messages', true);
    await queryRunner.dropTable('channel_members', true);
    await queryRunner.dropTable('channels', true);
  }
}
