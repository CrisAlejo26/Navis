import { ALL_LOCAL_TABLES, type LocalTable } from './local-schema';
import { entityKeyColumns } from './sync-keys';
import { SYNC_COVERAGE } from './sync-coverage';
import { SYNC_PARENTS } from './sync-parents';

/**
 * Genera los triggers que alimentan `sync_changes` y `sync_revisions`. Uno por
 * tabla sincronizada y por motor: SQLite necesita un trigger por evento, y
 * Postgres una función por tabla (cada una resuelve su propio ámbito).
 *
 * El ámbito (`church_id`, `owner_id`) lo resuelve el propio trigger, subiendo
 * por `SYNC_PARENTS` en las tablas hijas, para que el filtro de permisos del
 * servidor no tenga que adivinar de quién es una fila ya borrada.
 */
export interface ScopeSql {
    church: string;
    owner: string;
}

const NULL_SCOPE: ScopeSql = { church: 'NULL', owner: 'NULL' };

function tableByName(name: string): LocalTable {
    const table = ALL_LOCAL_TABLES.find((one) => one.name === name);
    if (!table) throw new Error(`Tabla local desconocida: ${name}`);
    return table;
}

/** Expresiones SQL de la iglesia y el dueño de la fila `ref` de `table`. `depth` evita choques de alias. */
export function scopeSql(table: string, ref: string, depth = 0): ScopeSql {
    const entry = SYNC_COVERAGE[table];
    if (!entry) throw new Error(`Sin política de sincronización: ${table}`);
    const columns = tableByName(table).columns.map((column) => column.name);

    // Una iglesia es su propio ámbito: la ve quien es miembro, no su `owner_id`.
    if (table === 'churches') return { church: `${ref}.id`, owner: 'NULL' };
    if (entry.scope === 'system') return NULL_SCOPE;
    if (entry.scope === 'owner') return { church: 'NULL', owner: `${ref}.owner_id` };
    if (entry.scope === 'church') {
        return {
            church: `${ref}.church_id`,
            owner: columns.includes('owner_id') ? `${ref}.owner_id` : 'NULL',
        };
    }

    const parent = SYNC_PARENTS[table];
    if (!parent) throw new Error(`La tabla hija ${table} no declara su padre`);
    const alias = `p${String(depth + 1)}`;
    const inner = scopeSql(parent.table, alias, depth + 1);
    const lookup = (expression: string): string =>
        `(SELECT ${expression} FROM "${parent.table}" ${alias} WHERE ${alias}.id = ${ref}.${parent.column})`;
    return { church: lookup(inner.church), owner: lookup(inner.owner) };
}

/** Las tablas que llevan trigger. */
export function syncedTables(): string[] {
    return Object.entries(SYNC_COVERAGE)
        .filter(([, entry]) => entry.policy === 'synced')
        .map(([name]) => name);
}

const hasDeletedAt = (table: string): boolean =>
    tableByName(table).columns.some((c) => c.name === 'deleted_at');

/** El identificador de la fila: su `id`, o el par de columnas de una clave compuesta unido con `:`. */
function entityIdSql(table: string, ref: string, driver: 'sqlite' | 'postgres'): string {
    const columns = entityKeyColumns(table).map((column) =>
        driver === 'postgres' ? `${ref}.${column}::text` : `${ref}.${column}`,
    );
    return columns.join(` || ':' || `);
}

/** `delete` solo si la tabla tiene borrado lógico y la fila acaba de borrarse; el resto, `upsert`. */
const updateOperation = (table: string, ref: string): string =>
    hasDeletedAt(table)
        ? `CASE WHEN ${ref}.deleted_at IS NOT NULL THEN 'delete' ELSE 'upsert' END`
        : `'upsert'`;

const sqliteTriggerBody = (table: string, ref: 'NEW' | 'OLD', op: string): string => {
    const scope = scopeSql(table, ref);
    const id = entityIdSql(table, ref, 'sqlite');
    return `WHEN (SELECT capturing FROM sync_installation LIMIT 1) = 1 BEGIN
INSERT INTO sync_revisions (table_name, entity_id, revision) VALUES ('${table}', ${id}, 1)
  ON CONFLICT (table_name, entity_id) DO UPDATE SET revision = revision + 1;
INSERT INTO sync_changes (id, table_name, entity_id, op, revision, church_id, owner_id, created_at)
VALUES (lower(hex(randomblob(16))), '${table}', ${id}, ${op},
  (SELECT revision FROM sync_revisions WHERE table_name = '${table}' AND entity_id = ${id}),
  ${scope.church}, ${scope.owner}, strftime('%Y-%m-%d %H:%M:%f', 'now'));
END`;
};

function sqliteStatements(table: string): string[] {
    const events: [string, string, 'NEW' | 'OLD', string][] = [
        ['ai', 'INSERT', 'NEW', `'upsert'`],
        ['au', 'UPDATE', 'NEW', updateOperation(table, 'NEW')],
        ['ad', 'DELETE', 'OLD', `'delete'`],
    ];
    return events.flatMap(([suffix, event, ref, op]) => [
        `DROP TRIGGER IF EXISTS sync_${table}_${suffix}`,
        `CREATE TRIGGER sync_${table}_${suffix} AFTER ${event} ON "${table}" ${sqliteTriggerBody(table, ref, op)}`,
    ]);
}

function postgresStatements(table: string): string[] {
    const scope = scopeSql(table, 'r');
    const id = entityIdSql(table, 'r', 'postgres');
    return [
        `CREATE OR REPLACE FUNCTION sync_capture_${table}() RETURNS trigger AS $fn$
DECLARE r record; rev integer; kind text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sync_installation WHERE capturing) THEN RETURN NULL; END IF;
  IF TG_OP = 'DELETE' THEN r := OLD; kind := 'delete';
  ELSE r := NEW; kind := CASE WHEN TG_OP = 'UPDATE' THEN ${updateOperation(table, 'NEW')} ELSE 'upsert' END;
  END IF;
  INSERT INTO sync_revisions (table_name, entity_id, revision) VALUES ('${table}', ${id}, 1)
    ON CONFLICT (table_name, entity_id) DO UPDATE SET revision = sync_revisions.revision + 1
    RETURNING revision INTO rev;
  INSERT INTO sync_changes (id, table_name, entity_id, op, revision, church_id, owner_id, created_at)
  VALUES (gen_random_uuid(), '${table}', ${id}, kind, rev, (${scope.church})::uuid, (${scope.owner})::text, now());
  RETURN NULL;
END $fn$ LANGUAGE plpgsql`,
        `DROP TRIGGER IF EXISTS sync_${table} ON "${table}"`,
        `CREATE TRIGGER sync_${table} AFTER INSERT OR UPDATE OR DELETE ON "${table}" FOR EACH ROW EXECUTE FUNCTION sync_capture_${table}()`,
    ];
}

/** Todas las sentencias (una por elemento) que instalan los triggers de `tables`, para el motor dado. */
export function triggerStatements(
    driver: 'sqlite' | 'postgres',
    tables: readonly string[] = syncedTables(),
): string[] {
    return tables.flatMap((table) =>
        driver === 'postgres' ? postgresStatements(table) : sqliteStatements(table),
    );
}
