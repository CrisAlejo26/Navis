import { ALL_LOCAL_TABLES, LOCAL_INDEXES, createIndexSql, createTableSql } from '@navis/shared';
import { randomUUID } from 'expo-crypto';
import * as SQLite from 'expo-sqlite';

/**
 * La base de datos **local del teléfono** (RFC 0024, Fase 1).
 *
 * No es la de la API: es la copia de trabajo del dispositivo, con el esquema
 * espejo de `@navis/shared` (`ALL_LOCAL_TABLES`). Las migraciones van
 * versionadas con `PRAGMA user_version` — SQLite del móvil no pasa por
 * `pnpm db:migrate` — y cada versión aplica lo suyo dentro de una
 * transacción: o entra entera o no entra nada.
 */

export type LocalDb = SQLite.SQLiteDatabase;

let instance: LocalDb | null = null;

/** Inyecta la base en los tests: un fake con la misma interfaz mínima. */
export function setDbForTests(fake: LocalDb | null): void {
  instance = fake;
}

/** Versión actual del esquema local. Cada cambio añade un caso a `migrations`. */
const SCHEMA_VERSION = 2;

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
};

export async function getDb(): Promise<LocalDb> {
  if (instance) return instance;

  const db = await SQLite.openDatabaseAsync('navis.db');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;

  for (let version = current + 1; version <= SCHEMA_VERSION; version++) {
    const migration = migrations[version];
    if (!migration) continue;
    await db.withTransactionAsync(async () => {
      await migration(db);
    });
  }
  await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);

  instance = db;
  return db;
}

/** Para el `created_at`/`updated_at` de cada fila: ISO completo, comparable como texto. */
export function nowIso(): string {
  return new Date().toISOString();
}

/** Un identificador con la misma forma que los uuid de la API (texto v4). */
export function newId(): string {
  return randomUUID();
}
