import {
  believerName,
  toSearchName,
  type Believer,
  type BelieverListItem,
  type BelieversQuery,
  type BelieversSummary,
  type Gift,
  type Paginated,
} from '@navis/shared';

import type { SQLiteBindValue } from 'expo-sqlite';

import { getDb, newId, nowIso } from '../db';
import { removeBelieverPhotoAt, storeBelieverPhoto } from '../photo-storage';
import { listGifts } from './catalog-repo';
import {
  believerColumns,
  DAYS_SINCE,
  NEEDS_ATTENTION,
  deviceToday,
  filterStatuses,
  type BelieverRow,
} from './believers-sql';
/**
 * Los creyentes **en local** (RFC 0003 sobre RFC 0024): el mismo contrato que
 * `BelieversService` de la API —listado paginado, resumen, ficha y escritura—,
 * resuelto con consultas directas sobre SQLite del teléfono.
 */

const PAGE_DEFAULT = 20;

interface ListQuery extends BelieversQuery {
  churchId: string;
  /**
   * Salto explícito, para paginar con páginas de tamaño desigual (primera
   * carga más grande y luego de veinte en veinte): sin él, el salto sale de
   * `(page - 1) * limit`, que solo vale con páginas del mismo tamaño.
   */
  offset?: number;
}

function orderBy(sort: BelieversQuery['sort'], order: BelieversQuery['order']): string {
  const dir = order === 'desc' ? 'DESC' : 'ASC';
  switch (sort) {
    case 'status':
      return `status ${dir}, search_name ASC`;
    case 'createdAt':
      return `created_at ${dir}, search_name ASC`;
    case 'lastNote':
      // Sin nota ninguna va primero (§6.1); con nota, la más vieja delante.
      return `last_note_at IS NULL DESC, last_note_at ${order === 'desc' ? 'DESC' : 'ASC'}, search_name ASC`;
    default:
      return `search_name ${dir}`;
  }
}

function whereFilters(
  query: ListQuery,
  today: string,
): { clauses: string[]; params: SQLiteBindValue[] } {
  const clauses = ['b.church_id = ?', 'b.deleted_at IS NULL'];
  const params: SQLiteBindValue[] = [query.churchId];

  if (query.search) {
    clauses.push('b.search_name LIKE ?');
    params.push(`%${toSearchName(query.search)}%`);
  }
  const statuses = filterStatuses(query.status);
  if (statuses.length > 0) {
    clauses.push(`b.status IN (${statuses.map(() => '?').join(', ')})`);
    params.push(...statuses);
  } else {
    // Sin filtro de estado, los inactivos no estorban el listado: vuelven
    // cuando la pastilla «Inactivo» los pide. Los trasladados siguen —
    // aún pertenecen.
    clauses.push(`b.status != 'inactivo'`);
  }
  if (query.congregationId) {
    clauses.push('b.congregation_id = ?');
    params.push(query.congregationId);
  }
  if (query.giftId) {
    clauses.push(
      'EXISTS (SELECT 1 FROM believer_gifts bg WHERE bg.believer_id = b.id AND bg.deleted_at IS NULL AND bg.gift_id = ?)',
    );
    params.push(query.giftId);
  }
  if (query.tagId) {
    clauses.push(
      'EXISTS (SELECT 1 FROM believer_tag_links tl WHERE tl.believer_id = b.id AND tl.deleted_at IS NULL AND tl.tag_id = ?)',
    );
    params.push(query.tagId);
  }
  if (query.ministry) {
    clauses.push(
      'EXISTS (SELECT 1 FROM believer_ministries bm WHERE bm.believer_id = b.id AND bm.deleted_at IS NULL AND bm.ministry = ?)',
    );
    params.push(query.ministry);
  }
  if (query.attention) {
    clauses.push(NEEDS_ATTENTION);
    params.push(today);
  }
  return { clauses, params };
}

/** Los dones, etiquetas y cuenta de notas de una página de personas. */
async function decorate(
  churchId: string,
  ids: string[],
): Promise<Map<string, Partial<BelieverListItem>>> {
  const extras = new Map<string, Partial<BelieverListItem>>();
  if (ids.length === 0) return extras;
  const marks = ids.map(() => '?').join(', ');
  const db = await getDb();

  const giftRows = await db.getAllAsync<{
    believer_id: string;
    id: string;
    name: string;
    accent: string;
  }>(
    `SELECT bg.believer_id, g.id, g.name, g.accent FROM believer_gifts bg
     JOIN gifts g ON g.id = bg.gift_id
     WHERE bg.believer_id IN (${marks}) AND bg.deleted_at IS NULL AND g.deleted_at IS NULL
     ORDER BY g.position ASC, g.name ASC`,
    ...ids,
  );
  const tagRows = await db.getAllAsync<{
    believer_id: string;
    id: string;
    name: string;
    accent: string;
  }>(
    `SELECT tl.believer_id, t.id, t.name, t.accent FROM believer_tag_links tl
     JOIN believer_tags t ON t.id = tl.tag_id
     WHERE tl.believer_id IN (${marks}) AND tl.deleted_at IS NULL AND t.deleted_at IS NULL
     ORDER BY t.position ASC, t.name ASC`,
    ...ids,
  );
  const noteRows = await db.getAllAsync<{ believer_id: string; total: number }>(
    `SELECT believer_id, COUNT(*) AS total FROM believer_notes
     WHERE believer_id IN (${marks}) AND deleted_at IS NULL GROUP BY believer_id`,
    ...ids,
  );
  const ministryRows = await db.getAllAsync<{ believer_id: string; ministry: string }>(
    `SELECT believer_id, ministry FROM believer_ministries
     WHERE believer_id IN (${marks}) AND deleted_at IS NULL ORDER BY ministry ASC`,
    ...ids,
  );

  for (const id of ids) extras.set(id, { gifts: [], tags: [], notesCount: 0, ministries: [] });
  for (const row of giftRows) {
    const extra = extras.get(row.believer_id);
    extra?.gifts?.push({
      id: row.id,
      churchId,
      name: row.name,
      accent: row.accent,
      position: 0,
      isSystem: false,
      isActive: true,
    });
  }
  for (const row of tagRows) {
    const extra = extras.get(row.believer_id);
    extra?.tags?.push({
      id: row.id,
      churchId,
      name: row.name,
      accent: row.accent,
      position: 0,
      isSystem: false,
      isActive: true,
    });
  }
  for (const row of noteRows) {
    const extra = extras.get(row.believer_id);
    if (extra) extra.notesCount = row.total;
  }
  for (const row of ministryRows) {
    extras.get(row.believer_id)?.ministries?.push(row.ministry);
  }
  return extras;
}

function toBeliever(row: BelieverRow, ministries: string[]): Believer {
  return {
    id: row.id,
    churchId: row.church_id,
    congregationId: row.congregation_id,
    firstName: row.first_name,
    lastName: row.last_name ?? '',
    phone: row.phone,
    email: row.email,
    status: row.status as Believer['status'],
    alertAfterDays: row.alert_after_days,
    lastNoteAt: row.last_note_at,
    createdAt: row.created_at,
    ministries,
    arrivedAt: row.arrived_at,
    arrivalSite: row.arrival_site,
    bibleReadings: row.bible_readings,
    vivenciasReadings: row.vivencias_readings,
    bibleInstituteTimes: row.bible_institute_times,
    ministryDates: {},
    giftDates: {},
    hasPhoto: row.photo_key !== null,
  };
}

export async function listBelievers(query: ListQuery): Promise<Paginated<BelieverListItem>> {
  const db = await getDb();
  const today = deviceToday();
  const { clauses, params } = whereFilters(query, today);
  const page = query.page ?? 1;
  const limit = query.limit ?? PAGE_DEFAULT;

  const totalRow = await db.getFirstAsync<{ total: number }>(
    `SELECT COUNT(*) AS total FROM believers b WHERE ${clauses.join(' AND ')}`,
    ...params,
  );
  const rows = await db.getAllAsync<BelieverRow & { days_without_note: number }>(
    `SELECT ${believerColumns('b')}, ${DAYS_SINCE} AS days_without_note
     FROM believers b WHERE ${clauses.join(' AND ')}
     ORDER BY ${orderBy(query.sort, query.order)}
     LIMIT ? OFFSET ?`,
    // El orden de los parámetros es el de los `?` en el SQL: el de la sonda
    // (SELECT) va antes que los del WHERE, y después límite y salto.
    today,
    ...params,
    limit,
    query.offset ?? (page - 1) * limit,
  );

  const ids = rows.map((row) => row.id);
  const extras = await decorate(query.churchId, ids);

  const items: BelieverListItem[] = [];
  for (const row of rows) {
    const extra = extras.get(row.id) ?? {};
    items.push({
      ...toBeliever(row, extra.ministries ?? []),
      daysWithoutNote: row.days_without_note,
      needsAttention: row.alert_after_days !== null && row.days_without_note > row.alert_after_days,
      gifts: extra.gifts ?? [],
      tags: extra.tags ?? [],
      featuredTagId: row.featured_tag_id,
      notesCount: extra.notesCount ?? 0,
    });
  }
  return {
    items,
    total: totalRow?.total ?? 0,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil((totalRow?.total ?? 0) / limit)),
  };
}

export async function believersSummary(churchId: string): Promise<BelieversSummary> {
  const db = await getDb();
  const today = deviceToday();
  const monthStart = today.slice(0, 8) + '01';
  const row = await db.getFirstAsync<{
    total: number;
    activo: number;
    nuevo: number;
    inactivo: number;
    trasladado: number;
    attention: number | null;
    fresh: number | null;
  }>(
    `SELECT COUNT(*) AS total,
       SUM(CASE WHEN status = 'activo' THEN 1 ELSE 0 END) AS activo,
       SUM(CASE WHEN status = 'nuevo' THEN 1 ELSE 0 END) AS nuevo,
       SUM(CASE WHEN status = 'inactivo' THEN 1 ELSE 0 END) AS inactivo,
       SUM(CASE WHEN status = 'trasladado' THEN 1 ELSE 0 END) AS trasladado,
       SUM(CASE WHEN ${NEEDS_ATTENTION} THEN 1 ELSE 0 END) AS attention,
       SUM(CASE WHEN substr(created_at, 1, 10) >= ? THEN 1 ELSE 0 END) AS fresh
     FROM believers WHERE church_id = ? AND deleted_at IS NULL`,
    today,
    monthStart,
    churchId,
  );

  return {
    total: row?.total ?? 0,
    byStatus: {
      activo: row?.activo ?? 0,
      nuevo: row?.nuevo ?? 0,
      inactivo: row?.inactivo ?? 0,
      trasladado: row?.trasladado ?? 0,
    },
    needsAttention: row?.attention ?? 0,
    newThisMonth: row?.fresh ?? 0,
  };
}

/** La ficha completa: dones con su fecha, labores con la suya y etiquetas. */
export async function findBeliever(id: string, churchId: string): Promise<BelieverListItem | null> {
  const db = await getDb();
  const today = deviceToday();
  const row = await db.getFirstAsync<BelieverRow & { days_without_note: number }>(
    `SELECT ${believerColumns('b')}, ${DAYS_SINCE} AS days_without_note
     FROM believers b WHERE b.id = ? AND b.church_id = ? AND b.deleted_at IS NULL`,
    today,
    id,
    churchId,
  );
  if (!row) return null;

  const ministryRows = await db.getAllAsync<{ ministry: string; started_at: string | null }>(
    'SELECT ministry, started_at FROM believer_ministries WHERE believer_id = ? AND deleted_at IS NULL ORDER BY ministry ASC',
    id,
  );
  const giftRows = await db.getAllAsync<{ gift_id: string; received_at: string | null }>(
    'SELECT gift_id, received_at FROM believer_gifts WHERE believer_id = ? AND deleted_at IS NULL',
    id,
  );
  const tagRows = await db.getAllAsync<{
    id: string;
    name: string;
    accent: string;
    position: number;
  }>(
    `SELECT t.id, t.name, t.accent, t.position FROM believer_tag_links tl
     JOIN believer_tags t ON t.id = tl.tag_id
     WHERE tl.believer_id = ? AND tl.deleted_at IS NULL AND t.deleted_at IS NULL
     ORDER BY t.position ASC, t.name ASC`,
    id,
  );
  const catalog = await listGifts(churchId);
  const giftById = new Map(catalog.map((one) => [one.id, one]));
  const noteRow = await db.getFirstAsync<{ total: number }>(
    'SELECT COUNT(*) AS total FROM believer_notes WHERE believer_id = ? AND deleted_at IS NULL',
    id,
  );

  const gifts: Gift[] = giftRows
    .map((one) => {
      const gift = giftById.get(one.gift_id);
      return gift ? { ...gift } : null;
    })
    .filter((one): one is Gift => one !== null);

  return {
    ...toBeliever(
      row,
      ministryRows.map((one) => one.ministry),
    ),
    ministryDates: Object.fromEntries(ministryRows.map((one) => [one.ministry, one.started_at])),
    giftDates: Object.fromEntries(giftRows.map((one) => [one.gift_id, one.received_at])),
    gifts,
    tags: tagRows.map((one) => ({
      id: one.id,
      churchId,
      name: one.name,
      accent: one.accent,
      position: one.position,
      isSystem: false,
      isActive: true,
    })),
    featuredTagId: row.featured_tag_id,
    notesCount: noteRow?.total ?? 0,
    daysWithoutNote: row.days_without_note,
    needsAttention: row.alert_after_days !== null && row.days_without_note > row.alert_after_days,
  };
}

async function replaceLinks(
  db: Awaited<ReturnType<typeof getDb>>,
  believerId: string,
  table: 'believer_ministries' | 'believer_gifts' | 'believer_tag_links',
  column: 'ministry' | 'gift_id' | 'tag_id',
  values: string[],
  dateColumn: 'started_at' | 'received_at' | null = null,
  dates: Record<string, string | null> = {},
  featuredTagId: string | null = null,
): Promise<void> {
  // La API borra y reescribe el juego entero (BelieverLinksService): son
  // cuatro filas y el índice único ya impide repetir. Aquí, lo mismo.
  await db.runAsync(`DELETE FROM ${table} WHERE believer_id = ?`, believerId);
  for (const value of values) {
    const date = dates[value] ?? null;
    if (dateColumn && date) {
      await db.runAsync(
        `INSERT INTO ${table} (id, created_at, updated_at, deleted_at, believer_id, ${column}, ${dateColumn}) VALUES (?, ?, ?, NULL, ?, ?, ?)`,
        newId(),
        nowIso(),
        nowIso(),
        believerId,
        value,
        date,
      );
    } else {
      await db.runAsync(
        `INSERT INTO ${table} (id, created_at, updated_at, deleted_at, believer_id, ${column}) VALUES (?, ?, ?, NULL, ?, ?)`,
        newId(),
        nowIso(),
        nowIso(),
        believerId,
        value,
      );
    }
  }
  if (table === 'believer_tag_links') {
    await db.runAsync(
      'UPDATE believers SET featured_tag_id = ?, updated_at = ? WHERE id = ?',
      featuredTagId,
      nowIso(),
      believerId,
    );
  }
}

export interface WriteBelieverInput {
  firstName: string;
  lastName?: string;
  phone?: string | null;
  email?: string | null;
  congregationId?: string | null;
  status?: string;
  alertAfterDays?: number | null;
  ministries?: string[];
  /** Cuándo empezó cada labor, por `slug`; lo que no esté en `ministries` se cae (RFC 0012). */
  ministryDates?: Record<string, string | null>;
  giftIds?: string[];
  /** Cuándo recibió cada don, por identificador; lo que no esté en `giftIds` se cae. */
  giftDates?: Record<string, string | null>;
  tagIds?: string[];
  /** La que sale en la tabla. Si no está entre las etiquetas, se cae (como en la API). */
  featuredTagId?: string | null;
  arrivedAt?: string | null;
  arrivalSite?: string | null;
  bibleReadings?: number | null;
  vivenciasReadings?: number | null;
  bibleInstituteTimes?: number | null;
  /**
   * La fotografía. `undefined` no la toca; `null` la quita; un URI —el del
   * fichero temporal que eligió quien escribe— la copia a su sitio definitivo
   * (`photos/<id>`) y apunta `photo_key` a él, como hacen las notas con sus
   * audios. El borrado del fichero viejo va dentro: reponer no deja huérfanos.
   */
  photoUri?: string | null;
}

export async function createBeliever(churchId: string, input: WriteBelieverInput): Promise<string> {
  const db = await getDb();
  const id = newId();
  const now = nowIso();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO believers (id, created_at, updated_at, deleted_at, church_id, congregation_id, first_name, last_name,
         phone, email, status, search_name, alert_after_days, arrived_at, arrival_site, bible_readings,
         vivencias_readings, bible_institute_times)
       VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      now,
      now,
      churchId,
      input.congregationId ?? null,
      input.firstName,
      input.lastName ?? '',
      input.phone ?? null,
      // Como `emailSchema` de la API: el correo se guarda en minúsculas.
      input.email ? input.email.trim().toLowerCase() : null,
      input.status ?? 'activo',
      toSearchName(believerName({ firstName: input.firstName, lastName: input.lastName })),
      input.alertAfterDays === undefined ? 30 : input.alertAfterDays,
      input.arrivedAt ?? null,
      input.arrivalSite ?? null,
      input.bibleReadings ?? null,
      input.vivenciasReadings ?? null,
      input.bibleInstituteTimes ?? null,
    );
    await applyLinks(db, id, input);
    if (input.photoUri) {
      const stored = await storeBelieverPhoto(id, input.photoUri);
      await db.runAsync(
        'UPDATE believers SET photo_key = ?, updated_at = ? WHERE id = ?',
        stored,
        nowIso(),
        id,
      );
    }
  });
  return id;
}

export async function updateBeliever(
  id: string,
  churchId: string,
  input: Partial<WriteBelieverInput>,
): Promise<void> {
  const db = await getDb();
  const existing = await db.getFirstAsync<{
    first_name: string;
    last_name: string | null;
    photo_key: string | null;
  }>(
    'SELECT first_name, last_name, photo_key FROM believers WHERE id = ? AND church_id = ? AND deleted_at IS NULL',
    id,
    churchId,
  );
  if (!existing) throw new Error('not-found');

  const fields: string[] = [];
  const params: SQLiteBindValue[] = [];
  const set = (column: string, value: SQLiteBindValue) => {
    fields.push(`${column} = ?`);
    params.push(value);
  };

  const firstName = input.firstName ?? existing.first_name;
  const lastName = input.lastName ?? existing.last_name ?? '';
  if (input.firstName !== undefined || input.lastName !== undefined) {
    set('first_name', firstName);
    set('last_name', lastName);
    set('search_name', toSearchName(believerName({ firstName, lastName })));
  }
  if (input.phone !== undefined) set('phone', input.phone);
  if (input.email !== undefined) {
    set('email', input.email ? input.email.trim().toLowerCase() : null);
  }
  if (input.congregationId !== undefined) set('congregation_id', input.congregationId);
  if (input.status !== undefined) set('status', input.status);
  if (input.alertAfterDays !== undefined) set('alert_after_days', input.alertAfterDays);
  if (input.arrivedAt !== undefined) set('arrived_at', input.arrivedAt);
  if (input.arrivalSite !== undefined) set('arrival_site', input.arrivalSite);
  if (input.bibleReadings !== undefined) set('bible_readings', input.bibleReadings);
  if (input.vivenciasReadings !== undefined) set('vivencias_readings', input.vivenciasReadings);
  if (input.bibleInstituteTimes !== undefined)
    set('bible_institute_times', input.bibleInstituteTimes);
  if (input.featuredTagId !== undefined) set('featured_tag_id', input.featuredTagId);

  // La foto: reponer borra el fichero que había —una fila con una URI muerta
  // solo vale para que la imagen no cargue—, y quitar limpia ambos lados.
  if (input.photoUri === null) {
    removeBelieverPhotoAt(existing.photo_key ?? '');
    set('photo_key', null);
  } else if (input.photoUri !== undefined) {
    const stored = await storeBelieverPhoto(id, input.photoUri);
    if (existing.photo_key) removeBelieverPhotoAt(existing.photo_key);
    set('photo_key', stored);
  }

  await db.withTransactionAsync(async () => {
    if (fields.length > 0) {
      await db.runAsync(
        `UPDATE believers SET ${fields.join(', ')}, updated_at = ? WHERE id = ?`,
        ...params,
        nowIso(),
        id,
      );
    }
    await applyLinks(db, id, input);
  });
}

async function applyLinks(
  db: Awaited<ReturnType<typeof getDb>>,
  id: string,
  input: Partial<WriteBelieverInput>,
): Promise<void> {
  if (input.ministries) {
    await replaceLinks(
      db,
      id,
      'believer_ministries',
      'ministry',
      input.ministries,
      'started_at',
      input.ministryDates,
    );
  }
  if (input.giftIds) {
    await replaceLinks(
      db,
      id,
      'believer_gifts',
      'gift_id',
      input.giftIds,
      'received_at',
      input.giftDates,
    );
  }
  if (input.tagIds) {
    // El destacado **manda la lista, no la petición**: si llega uno que no
    // está entre las suyas, se cae aquí (como en la API).
    const featured = input.tagIds.includes(input.featuredTagId ?? '') ? input.featuredTagId : null;
    await replaceLinks(db, id, 'believer_tag_links', 'tag_id', input.tagIds, null, {}, featured);
  } else if (input.featuredTagId !== undefined) {
    // Sin cambio de lista, el destacado solo se apunta si ya tiene la etiqueta.
    const has = await db.getFirstAsync<{ id: string }>(
      'SELECT id FROM believer_tag_links WHERE believer_id = ? AND tag_id = ? AND deleted_at IS NULL',
      id,
      input.featuredTagId,
    );
    if (has) {
      await db.runAsync(
        'UPDATE believers SET featured_tag_id = ?, updated_at = ? WHERE id = ?',
        input.featuredTagId,
        nowIso(),
        id,
      );
    }
  }
}

export async function deleteBeliever(id: string, churchId: string): Promise<void> {
  const db = await getDb();
  const now = nowIso();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'UPDATE believers SET deleted_at = ?, updated_at = ? WHERE id = ? AND church_id = ?',
      now,
      now,
      id,
      churchId,
    );
    await db.runAsync(
      'UPDATE believer_notes SET deleted_at = ?, updated_at = ? WHERE believer_id = ? AND deleted_at IS NULL',
      now,
      now,
      id,
    );
  });
}

/** La única acción en lote (§7.4): poner sede a los seleccionados. */
export async function setCongregation(
  churchId: string,
  ids: string[],
  congregationId: string | null,
): Promise<number> {
  if (ids.length === 0) return 0;
  const db = await getDb();
  const marks = ids.map(() => '?').join(', ');
  const result = await db.runAsync(
    `UPDATE believers SET congregation_id = ?, updated_at = ? WHERE church_id = ? AND deleted_at IS NULL AND id IN (${marks})`,
    congregationId,
    nowIso(),
    churchId,
    ...ids,
  );
  return result.changes ?? 0;
}
