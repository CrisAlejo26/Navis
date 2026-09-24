import {
    SCHEDULABLE_STATUSES,
    toSearchName,
    believerName,
    type Paginated,
    type Preacher,
} from '@navis/shared';

import { getDb } from '../db';

/**
 * Los candidatos del selector en **local** — la pareja de `PreachersService`
 * de la API, sobre SQLite del teléfono.
 *
 * Ordenado por quien lleva más tiempo sin subir, y del todo arriba quien no
 * ha subido nunca (SQLite pone los `NULL` primero en un `ASC` sin ayuda).
 * Paginado de a `limit`: el selector carga por tandas, no la iglesia entera.
 */

export interface PreacherQuery {
    /** El historial es de este calendario: el sonido no compite con el púlpito. */
    calendarId: string;
    /** El ministerio del calendario; sin él, se propone a cualquiera (D16). */
    ministry: string | null;
    q?: string;
    /** Cualquier creyente activo, no solo quien tiene el ministerio. */
    all?: boolean;
    from: string;
    to: string;
    page: number;
    limit: number;
}

export async function listPreachers(
    churchId: string,
    query: PreacherQuery,
): Promise<Paginated<Preacher>> {
    const db = await getDb();

    const where: string[] = [
        'b.church_id = ?',
        `b.status IN (${SCHEDULABLE_STATUSES.map(() => '?').join(', ')})`,
        'b.deleted_at IS NULL',
    ];
    const params: (string | number)[] = [churchId, ...SCHEDULABLE_STATUSES];

    if (query.q) {
        where.push('b.search_name LIKE ?');
        params.push(`%${toSearchName(query.q)}%`);
    }
    if (!query.all && query.ministry) {
        where.push(
            'EXISTS (SELECT 1 FROM believer_ministries m WHERE m.believer_id = b.id AND m.ministry = ? AND m.deleted_at IS NULL)',
        );
        params.push(query.ministry);
    }

    // Primero quien lleva más tiempo sin subir — en SQLite los nulos van
    // primeros en un `ASC`, así que «nunca ha subido» queda arriba sin `NULLS
    // FIRST` (que no existe aquí).
    const whereSql = where.join(' AND ');
    const lastSql = `(
    SELECT MAX(m.date) FROM meetings m
    INNER JOIN meeting_slots ms ON ms.meeting_id = m.id
    WHERE ms.believer_id = b.id AND m.church_id = ? AND m.calendar_id = ?
      AND m.deleted_at IS NULL AND m.status <> 'cancelada'
  )`;

    const counted = await db.getFirstAsync<{ total: number }>(
        `SELECT COUNT(*) AS total FROM believers b WHERE ${whereSql}`,
        ...params,
    );
    const total = counted?.total ?? 0;

    const people = await db.getAllAsync<{
        id: string;
        congregation_id: string | null;
        first_name: string;
        last_name: string;
        lastDate: string | null;
    }>(
        `SELECT b.id, b.congregation_id, b.first_name, b.last_name, ${lastSql} AS lastDate
     FROM believers b
     WHERE ${whereSql}
     ORDER BY ${lastSql} ASC, b.search_name ASC
     LIMIT ? OFFSET ?`,
        // `lastSql` aparece dos veces en el texto —en el SELECT y en el ORDER
        // BY—, así que sus dos parámetros van dos veces: los del `WHERE` no bastan
        // para las dos apariciones. Sqlite bindea por posición, en el orden en que
        // los `?` aparecen en el texto, no en el orden «lógico» de las partes.
        churchId,
        query.calendarId,
        ...params,
        churchId,
        query.calendarId,
        query.limit,
        (query.page - 1) * query.limit,
    );

    // Las labores del lote, agrupadas por persona (los `IN` vacíos se filtran
    // antes de la consulta — la trampa del `IN ('')`).
    const ministriesOf = new Map<string, string[]>();
    if (people.length > 0) {
        const placeholders = people.map(() => '?').join(', ');
        for (const row of await db.getAllAsync<{ believer_id: string; ministry: string }>(
            `SELECT believer_id, ministry FROM believer_ministries
       WHERE believer_id IN (${placeholders}) AND deleted_at IS NULL`,
            ...people.map((one) => one.id),
        )) {
            ministriesOf.set(row.believer_id, [
                ...(ministriesOf.get(row.believer_id) ?? []),
                row.ministry,
            ]);
        }
    }

    const rows = people.length
        ? await db.getAllAsync<{ believer_id: string; times: number }>(
              `SELECT ms.believer_id, COUNT(*) AS times FROM meeting_slots ms
         INNER JOIN meetings m ON m.id = ms.meeting_id
         WHERE m.church_id = ? AND m.calendar_id = ? AND m.deleted_at IS NULL
           AND m.status <> 'cancelada' AND m.date >= ? AND m.date <= ?
           AND ms.believer_id IN (${people.map(() => '?').join(', ')})
         GROUP BY ms.believer_id`,
              churchId,
              query.calendarId,
              query.from,
              query.to,
              ...people.map((one) => one.id),
          )
        : [];
    const timesInRange = new Map(rows.map((row) => [row.believer_id, Number(row.times ?? 0)]));

    const items: Preacher[] = people.map((person) => ({
        id: person.id,
        congregationId: person.congregation_id,
        ministries: ministriesOf.get(person.id) ?? [],
        name: believerName({
            firstName: person.first_name,
            lastName: person.last_name,
        }),
        lastDate: person.lastDate ?? null,
        timesInRange: timesInRange.get(person.id) ?? 0,
    }));

    return {
        items,
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
    };
}
