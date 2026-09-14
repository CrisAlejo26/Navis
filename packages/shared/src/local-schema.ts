/**
 * El esquema de la base de datos **local del teléfono** (RFC 0024, Fase 1).
 *
 * Un solo origen de verdad para las dos partes que tienen que cuadrar:
 *
 * - `apps/mobile/src/data/db.ts` genera el `CREATE TABLE` a partir de aquí.
 * - El test de paridad de la API compara estas columnas con los metadatos de
 *   las entidades de TypeORM: si alguien añade un campo a una entidad y no
 *   aquí (o al revés), el test falla.
 *
 * Los tipos son los lógicos de SQLite, no los de TypeORM. La correspondencia
 * que aplica el test de paridad:
 *
 * | TypeORM (SQLite)                  | Tipo local |
 * | --------------------------------- | ---------- |
 * | `text`, `varchar` (uuid), `date`, `time` | `text` |
 * | `int`, `integer`                  | `int`      |
 * | `boolean`                         | `bool`     |
 * | `datetime` (`TIMESTAMP`)          | `text` (ISO 8601) |
 */
export type LocalColumnType = 'text' | 'int' | 'real' | 'bool';

export interface LocalColumn {
  name: string;
  type: LocalColumnType;
  nullable?: boolean;
  pk?: boolean;
  /** Literal para el `DEFAULT` del DDL. No lo compara el test de paridad. */
  default?: string | number | boolean;
}

export interface LocalTable {
  name: string;
  /** Entidad de TypeORM que espeja. Las tablas propias del móvil no la llevan. */
  mirror?: string;
  columns: LocalColumn[];
}

/** `id`, `created_at`, `updated_at` y `deleted_at` de `BaseEntity`. */
const baseColumns: LocalColumn[] = [
  { name: 'id', type: 'text', pk: true },
  { name: 'created_at', type: 'text' },
  { name: 'updated_at', type: 'text' },
  { name: 'deleted_at', type: 'text', nullable: true },
];

function table(name: string, mirror: string, columns: LocalColumn[]): LocalTable {
  return { name, mirror, columns: [...baseColumns, ...columns] };
}

export const LOCAL_TABLES: LocalTable[] = [
  table('churches', 'Church', [
    { name: 'name', type: 'text' },
    { name: 'slug', type: 'text' },
    { name: 'city', type: 'text', nullable: true },
    { name: 'timezone', type: 'text', default: 'Europe/Madrid' },
    { name: 'country', type: 'text', default: 'ES' },
    { name: 'region', type: 'text', nullable: true },
    { name: 'owner_id', type: 'text' },
  ]),
  table('congregations', 'Congregation', [
    { name: 'church_id', type: 'text' },
    { name: 'name', type: 'text' },
    { name: 'city', type: 'text', nullable: true },
    { name: 'accent', type: 'text', default: 'primary' },
    { name: 'position', type: 'int', default: 0 },
    { name: 'is_default', type: 'bool', default: false },
    { name: 'is_active', type: 'bool', default: true },
  ]),
  table('believers', 'Believer', [
    { name: 'church_id', type: 'text' },
    { name: 'congregation_id', type: 'text', nullable: true },
    { name: 'first_name', type: 'text' },
    { name: 'last_name', type: 'text', default: '' },
    { name: 'phone', type: 'text', nullable: true },
    { name: 'email', type: 'text', nullable: true },
    { name: 'status', type: 'text', default: 'activo' },
    { name: 'search_name', type: 'text', default: '' },
    { name: 'alert_after_days', type: 'int', nullable: true, default: 30 },
    { name: 'last_note_at', type: 'text', nullable: true },
    { name: 'arrived_at', type: 'text', nullable: true },
    { name: 'arrival_site', type: 'text', nullable: true },
    { name: 'bible_readings', type: 'int', nullable: true },
    { name: 'vivencias_readings', type: 'int', nullable: true },
    { name: 'bible_institute_times', type: 'int', nullable: true },
    { name: 'user_id', type: 'text', nullable: true },
    { name: 'photo_key', type: 'text', nullable: true },
  ]),
  table('believer_notes', 'BelieverNote', [
    { name: 'church_id', type: 'text' },
    { name: 'believer_id', type: 'text' },
    { name: 'kind', type: 'text' },
    { name: 'occurred_at', type: 'text' },
    { name: 'told', type: 'text' },
    { name: 'advice', type: 'text', nullable: true },
    { name: 'gift_id', type: 'text', nullable: true },
    { name: 'remind_at', type: 'text', nullable: true },
    { name: 'remind_text', type: 'text', nullable: true },
    { name: 'remind_done_at', type: 'text', nullable: true },
    { name: 'author_id', type: 'text', nullable: true },
  ]),
  table('believer_tags', 'BelieverTag', [
    { name: 'church_id', type: 'text' },
    { name: 'name', type: 'text' },
    { name: 'accent', type: 'text', default: 'primary' },
    { name: 'position', type: 'int', default: 0 },
    { name: 'is_system', type: 'bool', default: false },
    { name: 'is_active', type: 'bool', default: true },
  ]),
  table('believer_tag_links', 'BelieverTagLink', [
    { name: 'believer_id', type: 'text' },
    { name: 'tag_id', type: 'text' },
  ]),
  table('note_audios', 'NoteAudio', [
    { name: 'note_id', type: 'text' },
    { name: 'mime_type', type: 'text' },
    { name: 'size_bytes', type: 'int' },
    { name: 'duration_seconds', type: 'int', nullable: true },
    { name: 'recorded', type: 'bool', default: true },
    { name: 'file_uri', type: 'text' },
  ]),
  table('meetings', 'Meeting', [
    { name: 'church_id', type: 'text' },
    { name: 'calendar_id', type: 'text' },
    { name: 'congregation_id', type: 'text' },
    { name: 'pattern_id', type: 'text', nullable: true },
    { name: 'date', type: 'text' },
    { name: 'start_time', type: 'text' },
    { name: 'name', type: 'text' },
    { name: 'accent', type: 'text' },
    { name: 'status', type: 'text', default: 'programada' },
    { name: 'notes', type: 'text', nullable: true },
  ]),
  table('ministries', 'Ministry', [
    { name: 'church_id', type: 'text' },
    { name: 'slug', type: 'text' },
    { name: 'name', type: 'text' },
    { name: 'accent', type: 'text', default: 'primary' },
    { name: 'position', type: 'int', default: 0 },
    { name: 'is_system', type: 'bool', default: false },
    { name: 'is_active', type: 'bool', default: true },
  ]),
  table('gifts', 'Gift', [
    { name: 'church_id', type: 'text' },
    { name: 'name', type: 'text' },
    { name: 'accent', type: 'text', default: 'primary' },
    { name: 'position', type: 'int', default: 0 },
    { name: 'is_system', type: 'bool', default: false },
    { name: 'is_active', type: 'bool', default: true },
  ]),
  table('believer_ministries', 'BelieverMinistry', [
    { name: 'believer_id', type: 'text' },
    { name: 'ministry', type: 'text' },
    { name: 'started_at', type: 'text', nullable: true },
  ]),
  table('believer_gifts', 'BelieverGift', [
    { name: 'believer_id', type: 'text' },
    { name: 'gift_id', type: 'text' },
    { name: 'received_at', type: 'text', nullable: true },
  ]),
  table('tasks', 'Task', [
    { name: 'church_id', type: 'text' },
    { name: 'owner_id', type: 'text' },
    { name: 'title', type: 'text' },
    { name: 'description', type: 'text', nullable: true },
    { name: 'date', type: 'text' },
    { name: 'time', type: 'text', nullable: true },
    { name: 'priority', type: 'text', default: 'media' },
    { name: 'status', type: 'text', nullable: true },
    { name: 'completed_at', type: 'text', nullable: true },
    { name: 'is_recurring', type: 'bool', default: false },
    { name: 'repeat_freq', type: 'text', nullable: true },
    { name: 'repeat_interval', type: 'int', default: 1 },
    { name: 'repeat_end_type', type: 'text', nullable: true },
    { name: 'repeat_end_date', type: 'text', nullable: true },
    { name: 'repeat_end_count', type: 'int', nullable: true },
  ]),
  table('tags', 'Tag', [
    { name: 'church_id', type: 'text' },
    { name: 'owner_id', type: 'text' },
    { name: 'name', type: 'text' },
    { name: 'icon', type: 'text' },
    { name: 'accent', type: 'text' },
    { name: 'position', type: 'int', default: 0 },
  ]),
  table('task_tags', 'TaskTag', [
    { name: 'task_id', type: 'text' },
    { name: 'tag_id', type: 'text' },
  ]),
  table('task_occurrences', 'TaskOccurrence', [
    { name: 'task_id', type: 'text' },
    { name: 'date', type: 'text' },
    { name: 'status', type: 'text' },
    { name: 'completed_at', type: 'text', nullable: true },
  ]),
];

/**
 * La cuenta **local**: sin Better Auth, porque no hay servidor que la emita.
 * La contraseña se guarda con hash (pepper del SecureStore + email de sal).
 */
export const LOCAL_USER_TABLE: LocalTable = {
  name: 'local_user',
  columns: [
    { name: 'id', type: 'text', pk: true },
    { name: 'name', type: 'text' },
    { name: 'email', type: 'text' },
    { name: 'password_hash', type: 'text' },
    { name: 'created_at', type: 'text' },
    { name: 'updated_at', type: 'text' },
  ],
};

/** Todas las tablas que crea la base local, en orden de dependencia. */
export const ALL_LOCAL_TABLES: LocalTable[] = [...LOCAL_TABLES, LOCAL_USER_TABLE];

/** Índices de la base local. Los únicos, para no chocar con recreos de SQLite. */
export const LOCAL_INDEXES: { name: string; table: string; columns: string[]; unique?: boolean }[] =
  [
    { name: 'UQ_local_user_email', table: 'local_user', columns: ['email'], unique: true },
    {
      name: 'IDX_believers_church_search',
      table: 'believers',
      columns: ['church_id', 'search_name'],
    },
    {
      name: 'IDX_believer_notes_church',
      table: 'believer_notes',
      columns: ['church_id', 'occurred_at'],
    },
    { name: 'IDX_meetings_church_date', table: 'meetings', columns: ['church_id', 'date'] },
    {
      name: 'IDX_tasks_church_owner_date',
      table: 'tasks',
      columns: ['church_id', 'owner_id', 'date'],
    },
    {
      name: 'UQ_task_occurrences',
      table: 'task_occurrences',
      columns: ['task_id', 'date'],
      unique: true,
    },
    { name: 'UQ_task_tags', table: 'task_tags', columns: ['task_id', 'tag_id'], unique: true },
    {
      name: 'IDX_believer_tag_links_believer',
      table: 'believer_tag_links',
      columns: ['believer_id'],
    },
    {
      name: 'IDX_believer_tags_church',
      table: 'believer_tags',
      columns: ['church_id', 'position'],
    },
    { name: 'IDX_note_audios_note', table: 'note_audios', columns: ['note_id'] },
  ];

const DDL_TYPE: Record<LocalColumnType, string> = {
  text: 'TEXT',
  int: 'INTEGER',
  real: 'REAL',
  bool: 'INTEGER',
};

function quote(value: NonNullable<LocalColumn['default']>): string {
  if (typeof value === 'string') return `'${value.replaceAll("'", "''")}'`;
  if (typeof value === 'boolean') return value ? '1' : '0';
  return String(value);
}

/** El `CREATE TABLE` de una tabla local. Sin `IF NOT EXISTS`: las migraciones van versionadas. */
export function createTableSql(one: LocalTable): string {
  const parts = one.columns.map((column) => {
    const bits = [`"${column.name}"`, DDL_TYPE[column.type]];
    if (!column.nullable) bits.push('NOT NULL');
    if (column.default !== undefined) bits.push(`DEFAULT ${quote(column.default)}`);
    return bits.join(' ');
  });
  return `CREATE TABLE "${one.name}" (${parts.join(', ')})`;
}

export function createIndexSql(one: (typeof LOCAL_INDEXES)[number]): string {
  return `CREATE ${one.unique ? 'UNIQUE ' : ''}INDEX "${one.name}" ON "${one.table}" (${one.columns
    .map((name) => `"${name}"`)
    .join(', ')})`;
}
