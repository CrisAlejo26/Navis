import {
  ACCENT_PALETTE,
  ALL_LOCAL_TABLES,
  LOCAL_INDEXES,
  SYSTEM_GIFTS,
  SYSTEM_MINISTRIES,
  createIndexSql,
  createTableSql,
} from '@navis/shared';
import * as SQLite from 'expo-sqlite';

import { seedCalendarScaffold } from './repos/calendar-seed';

/**
 * La base de datos **local del teléfono** (RFC 0024, Fase 1).
 *
 * No es la de la API: es la copia de trabajo del dispositivo, con el esquema
 * espejo de `@navis/shared` (`ALL_LOCAL_TABLES`). Las migraciones van
 * versionadas con `PRAGMA user_version` — SQLite del móvil no pasa por
 * `pnpm db:migrate` — y cada versión aplica lo suyo dentro de una
 * transacción: o entra entera o no entra nada.
 */

// El contrato y las utilidades viven en `local-db.ts`, un módulo sin
// dependencias: es lo que evita el ciclo de importación que Metro avisaba
// (`db.ts → calendar-seed.ts → db.ts`). Aquí se reexportan, que es de donde
// los repositorios las seguían tomando.
import { newId, nowIso, type LocalDb } from './local-db';
import type { SQLiteRunResult, SQLiteVariadicBindParams } from 'expo-sqlite';
export { nowIso, newId, type LocalDb } from './local-db';

/**
 * Sobre Android, dos llamadas que se cruzan sobre la misma conexión revientan
 * con «Call to function 'NativeDatabase.prepareAsync' has been rejected»
 * (NullPointerException) — y una vez muerta, **todas** las consultas siguientes
 * fallan: se vio al escribir en el buscador de creyentes. React Query lanza
 * consultas concurrentes a propósito (listado, resumen, catálogos), así que el
 * retardo del buscador no basta: toda operación pasa por una **cola**, de una
 * en una. Dentro de una transacción el acceso ya es exclusivo, y los pasos del
 * callback corren en línea sin pasar por la cola.
 */
function serialize(db: SQLite.SQLiteDatabase): LocalDb {
  let tail: Promise<unknown> = Promise.resolve();
  let inTransaction = false;

  const enqueue = <T>(op: () => Promise<T>): Promise<T> => {
    if (inTransaction) return op();
    const run = tail.then(op, op);
    tail = run.catch(() => undefined);
    return run;
  };

  return {
    async getAllAsync<T>(source: string, ...params: SQLiteVariadicBindParams): Promise<T[]> {
      return enqueue(() => db.getAllAsync<T>(source, ...params));
    },
    async getFirstAsync<T>(source: string, ...params: SQLiteVariadicBindParams): Promise<T | null> {
      return enqueue(() => db.getFirstAsync<T>(source, ...params));
    },
    async runAsync(source: string, ...params: SQLiteVariadicBindParams): Promise<SQLiteRunResult> {
      return enqueue(() => db.runAsync(source, ...params));
    },
    async execAsync(source: string): Promise<void> {
      return enqueue(() => db.execAsync(source));
    },
    withTransactionAsync(fn: () => Promise<void>): Promise<void> {
      return enqueue(async () => {
        inTransaction = true;
        try {
          await db.execAsync('BEGIN');
          try {
            await fn();
            await db.execAsync('COMMIT');
          } catch (error) {
            await db.execAsync('ROLLBACK');
            throw error;
          }
        } finally {
          inTransaction = false;
        }
      });
    },
  };
}

/**
 * La promesa de apertura y no la instancia abierta: si varios hooks piden la
 * base mientras la primera apertura sigue en marcha, cada uno abriría **su
 * propia conexión** (con su propia cola) y las consultas de unos y otros se
 * cruzarían — el NullPointerException de `NativeDatabase.prepareAsync` que
 * rompía el buscador de creyentes. Encadenadas a la misma promesa, abren
 * una sola conexión con una sola cola.
 */
let instancePromise: Promise<LocalDb> | null = null;

/** Inyecta la base en los tests: un fake con la misma interfaz mínima. */
export function setDbForTests(fake: LocalDb | null): void {
  instancePromise = fake ? Promise.resolve(fake) : null;
}

/** Versión actual del esquema local. Cada cambio añade un caso a `migrations`. */
const SCHEMA_VERSION = 6;

type Migration = (db: LocalDb) => Promise<void>;

const migrations: Record<number, Migration> = {
  1: async (db) => {
    for (const one of ALL_LOCAL_TABLES) {
      await db.execAsync(createTableSql(one));
    }
    for (const one of LOCAL_INDEXES) {
      await db.execAsync(createIndexSql(one));
    }
  },
  // RFC 0003 en móvil: el catálogo de etiquetas de creyentes, su vínculo y los
  // audios de las notas. En una base **nueva** la migración 1 ya crea estas
  // tablas —están en `ALL_LOCAL_TABLES`—, así que aquí solo se crea lo que
  // falte y la columna destacada va por ALTER, guardada igual.
  2: async (db) => {
    const existing = new Set(
      (
        await db.getAllAsync<{ name: string }>(
          "SELECT name FROM sqlite_master WHERE type = 'table'",
        )
      ).map((row) => row.name),
    );
    for (const one of ALL_LOCAL_TABLES) {
      if (!['believer_tags', 'believer_tag_links', 'note_audios'].includes(one.name)) continue;
      if (existing.has(one.name)) continue;
      await db.execAsync(createTableSql(one));
    }
    for (const one of LOCAL_INDEXES) {
      if (!one.table.startsWith('believer_tag') && one.table !== 'note_audios') continue;
      await db.execAsync(
        `CREATE INDEX IF NOT EXISTS "${one.name}" ON "${one.table}" (${one.columns.map((column) => `"${column}"`).join(', ')})`,
      );
    }
    const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(believers)');
    if (!columns.some((column) => column.name === 'featured_tag_id')) {
      await db.execAsync('ALTER TABLE believers ADD COLUMN "featured_tag_id" TEXT');
    }
  },
  // Las iglesias creadas **antes** del catálogo de serie quedaron sin dones ni
  // labores — se vio en el buscador de creyentes: las hojas de filtros salían
  // vacías porque esta base era anterior a lo que `createChurch` siembra hoy
  // (igual que el «SeedMinistryRoles» de la API: la migración que arregla
  // datos). Idempotente: solo repone cuando el catálogo está **vacío**; si la
  // iglesia tiene algo propio no se toca, y las de serie no se pueden borrar.
  3: async (db) => {
    const churches = await db.getAllAsync<{ id: string }>(
      'SELECT id FROM churches WHERE deleted_at IS NULL',
    );
    const now = nowIso();
    for (const church of churches) {
      const gifts = await db.getFirstAsync<{ total: number }>(
        'SELECT COUNT(*) AS total FROM gifts WHERE church_id = ? AND deleted_at IS NULL',
        church.id,
      );
      if ((gifts?.total ?? 0) === 0) {
        for (const [index, name] of SYSTEM_GIFTS.entries()) {
          await db.runAsync(
            'INSERT INTO gifts (id, created_at, updated_at, deleted_at, church_id, name, accent, position, is_system, is_active) VALUES (?, ?, ?, NULL, ?, ?, ?, ?, 1, 1)',
            newId(),
            now,
            now,
            church.id,
            name,
            ACCENT_PALETTE[index % ACCENT_PALETTE.length],
            index,
          );
        }
      }
      const ministries = await db.getFirstAsync<{ total: number }>(
        'SELECT COUNT(*) AS total FROM ministries WHERE church_id = ? AND deleted_at IS NULL',
        church.id,
      );
      if ((ministries?.total ?? 0) === 0) {
        for (const [index, ministry] of SYSTEM_MINISTRIES.entries()) {
          await db.runAsync(
            'INSERT INTO ministries (id, created_at, updated_at, deleted_at, church_id, slug, name, accent, position, is_system, is_active) VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, 1, 1)',
            newId(),
            now,
            now,
            church.id,
            ministry.slug,
            ministry.name,
            ACCENT_PALETTE[index % ACCENT_PALETTE.length],
            index,
          );
        }
      }
    }
  },
  // El calendario de programaciones en móvil (docs/calendario-movil-plan.md,
  // paso 1): cuatro tablas nuevas —calendars, meeting_patterns,
  // pattern_phases, meeting_slots— y su siembra: los cuatro calendarios de
  // serie y la semana por defecto de cada pareja calendario–sede. En una base
  // **nueva** la migración 1 ya las crea, así que aquí solo se crea lo que
  // falte; el andamiaje es idempotente (calendar-seed.ts). Los índices nuevos
  // van por su nombre con `IF NOT EXISTS`: recrear los que la migración 1 ya
  // puso moriría con «index already exists» — la trampa de los dropColumn de
  // la API, al revés.
  4: async (db) => {
    const CALENDAR_TABLES = ['calendars', 'meeting_patterns', 'pattern_phases', 'meeting_slots'];

    const existing = new Set(
      (
        await db.getAllAsync<{ name: string }>(
          "SELECT name FROM sqlite_master WHERE type = 'table'",
        )
      ).map((row) => row.name),
    );
    for (const one of ALL_LOCAL_TABLES) {
      if (!CALENDAR_TABLES.includes(one.name)) continue;
      if (existing.has(one.name)) continue;
      await db.execAsync(createTableSql(one));
    }

    for (const one of LOCAL_INDEXES) {
      if (!CALENDAR_TABLES.includes(one.table)) continue;
      const where = 'where' in one && one.where ? ` WHERE ${one.where}` : '';
      await db.execAsync(
        `CREATE INDEX IF NOT EXISTS "${one.name}" ON "${one.table}" (${one.columns.map((column) => `"${column}"`).join(', ')})${where}`,
      );
    }

    const now = nowIso();
    const churches = await db.getAllAsync<{ id: string }>(
      'SELECT id FROM churches WHERE deleted_at IS NULL',
    );
    for (const church of churches) {
      await seedCalendarScaffold(db, church.id, now);
    }
  },
  // Paridad con la API (RFC 0024): `believer_tag_links.featured` —la única
  // etiqueta que sale en la tabla del listado, antes vivía en
  // `believers.featured_tag_id`—, y `note_audios` pasa a la forma de la API:
  // `church_id` + `storage_key`, que es el nombre que comparte con el
  // servidor (en local guarda la URI del fichero del teléfono).
  5: async (db) => {
    if (!(await columnOf('believer_tag_links', 'featured', db))) {
      await db.execAsync(
        'ALTER TABLE believer_tag_links ADD COLUMN "featured" INTEGER NOT NULL DEFAULT 0',
      );
    }

    if (!(await columnOf('note_audios', 'storage_key', db))) {
      await db.execAsync('ALTER TABLE note_audios ADD COLUMN "storage_key" TEXT');
      await db.runAsync('UPDATE note_audios SET storage_key = file_uri WHERE storage_key IS NULL');
    }
    if (await columnOf('note_audios', 'file_uri', db)) {
      await db.execAsync('ALTER TABLE note_audios RENAME COLUMN file_uri TO file_uri_old');
      await db.execAsync('ALTER TABLE note_audios DROP COLUMN file_uri_old');
    }

    if (!(await columnOf('note_audios', 'church_id', db))) {
      await db.execAsync(
        'ALTER TABLE note_audios ADD COLUMN "church_id" TEXT NOT NULL DEFAULT \'\'',
      );
      await db.runAsync(
        'UPDATE note_audios SET church_id = (SELECT church_id FROM believer_notes WHERE believer_notes.id = note_audios.note_id)',
      );
    }
  },
  // Profecías en móvil (docs/profecias-movil-plan.md §4.2): las dos tablas
  // nuevas, las primeras sin `church_id` (D1). En una base **nueva** la
  // migración 1 ya las crea; aquí solo se crea lo que falte.
  6: async (db) => {
    const PROPHECY_TABLES = ['prophecies', 'prophecy_fulfillments'];

    const existing = new Set(
      (
        await db.getAllAsync<{ name: string }>(
          "SELECT name FROM sqlite_master WHERE type = 'table'",
        )
      ).map((row) => row.name),
    );
    for (const one of ALL_LOCAL_TABLES) {
      if (!PROPHECY_TABLES.includes(one.name)) continue;
      if (existing.has(one.name)) continue;
      await db.execAsync(createTableSql(one));
    }

    for (const one of LOCAL_INDEXES) {
      if (!PROPHECY_TABLES.includes(one.table)) continue;
      await db.execAsync(
        `CREATE INDEX IF NOT EXISTS "${one.name}" ON "${one.table}" (${one.columns.map((column) => `"${column}"`).join(', ')})`,
      );
    }
  },
};

async function columnOf(table: string, column: string, db: LocalDb): Promise<boolean> {
  const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  return columns.some((one) => one.name === column);
}

async function openDb(): Promise<LocalDb> {
  const raw = await SQLite.openDatabaseAsync('navis.db');
  const row = await raw.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;

  for (let version = current + 1; version <= SCHEMA_VERSION; version++) {
    const migration = migrations[version];
    if (!migration) continue;
    await raw.withTransactionAsync(async () => {
      await migration(raw);
    });
  }
  await raw.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);

  return serialize(raw);
}

export async function getDb(): Promise<LocalDb> {
  if (!instancePromise) instancePromise = openDb();
  return instancePromise;
}
