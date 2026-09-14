import {
  DASHBOARD_ACTIVITY_WEEKS,
  DASHBOARD_ATTENTION_PREVIEW,
  DASHBOARD_EVENTS_PREVIEW,
  DASHBOARD_EVENTS_WINDOW_DAYS,
  DASHBOARD_NOTES_PREVIEW,
  DASHBOARD_TASKS_PREVIEW,
  addDays,
  believerName,
  startOfWeek,
  type DashboardBucket,
  type DashboardSummary,
  type IsoDate,
} from '@navis/shared';

import { getDb } from '../db';

/**
 * El panel de inicio **en local** (RFC 0024, Fase 1): calcula la misma
 * `DashboardSummary` que `DashboardService` en la API, pero sobre SQLite del
 * teléfono y con consultas directas.
 *
 * Lo que en la API expanden servicios propios del calendario y de tareas
 * (`WeekSeederService`, `TasksExpansionService`) aquí se lee de las filas ya
 * materializadas: sin módulo de calendario ni de tareas en móvil todavía, no
 * hay patrones que expandir. Cuando esas pantallas lleguen, se retoma.
 */

/** Días hacia atrás que mira la racha, como el `STREAK_LOOKBACK_DAYS` de la API. */
const STREAK_LOOKBACK_DAYS = 30;

/** Cuánto del texto de una nota entra en la tarjeta (`EXCERPT_LENGTH` en la API). */
const EXCERPT_LENGTH = 140;

export interface DashboardRepository {
  summary(churchId: string, ownerId: string): Promise<DashboardSummary>;
}

/**
 * El día de hoy en la zona del dispositivo: en local la iglesia vive en el
 * huso del teléfono (`deviceTimezone` al crearla), así que «hoy» se calcula
 * con los getters locales y no en UTC (la trampa de `iso-day.ts`).
 */
export function todayIso(): IsoDate {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/** Días de calendario hasta hoy, con `julianday(date(...))` — entero, sin horas.
 * Es la traducción literal de `daysSince` de la API: hoy menos el día desde
 * el que se cuenta (última nota o alta). */
const DAYS_SINCE = `CAST(julianday(date(?)) - julianday(date(COALESCE(substr(last_note_at, 1, 10), substr(created_at, 1, 10)))) AS INTEGER)`;

const NEEDS_ATTENTION = `alert_after_days IS NOT NULL AND ${DAYS_SINCE} > alert_after_days`;

function toBucket(
  counts: Map<string, number>,
  describe: (value: string) => { label: string; accent: string | null },
): DashboardBucket[] {
  return [...counts]
    .map(([value, total]) => {
      const { label, accent } = describe(value);
      return { label, accent: accent ?? 'primary', count: total };
    })
    .sort((one, other) => other.count - one.count || one.label.localeCompare(other.label));
}

async function believersSummary(churchId: string, today: IsoDate) {
  const db = await getDb();
  const monthStart = today.slice(0, 8) + '01';
  const row = await db.getFirstAsync<{
    total: number;
    fresh: number | null;
    attention: number | null;
  }>(
    `SELECT
       COUNT(*) AS total,
       SUM(CASE WHEN substr(created_at, 1, 10) >= ? THEN 1 ELSE 0 END) AS fresh,
       SUM(CASE WHEN ${NEEDS_ATTENTION} THEN 1 ELSE 0 END) AS attention
     FROM believers
     WHERE church_id = ? AND deleted_at IS NULL`,
    monthStart,
    today,
    churchId,
  );

  return {
    total: row?.total ?? 0,
    newThisMonth: row?.fresh ?? 0,
    needsAttention: row?.attention ?? 0,
  };
}

async function attentionPeople(churchId: string, today: IsoDate) {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: string;
    first_name: string;
    last_name: string | null;
    photo_key: string | null;
    days_without_note: number;
  }>(
    `SELECT id, first_name, last_name, photo_key, ${DAYS_SINCE} AS days_without_note
     FROM believers
     WHERE church_id = ? AND deleted_at IS NULL AND ${NEEDS_ATTENTION}
     ORDER BY days_without_note ASC, search_name ASC
     LIMIT ?`,
    today,
    churchId,
    today,
    DASHBOARD_ATTENTION_PREVIEW,
  );

  return rows.map((row) => ({
    id: row.id,
    name: believerName({ firstName: row.first_name, lastName: row.last_name }),
    hasPhoto: row.photo_key !== null,
    daysWithoutNote: row.days_without_note,
  }));
}

async function upcomingEvents(churchId: string, today: IsoDate) {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    meeting_id: string | null;
    date: string;
    start_time: string;
    name: string;
    congregation_name: string | null;
    accent: string;
  }>(
    `SELECT m.id AS meeting_id, m.date, m.start_time, m.name, c.name AS congregation_name, m.accent
     FROM meetings m
     LEFT JOIN congregations c ON c.id = m.congregation_id
     WHERE m.church_id = ? AND m.deleted_at IS NULL
       AND m.date >= ? AND m.date <= ? AND m.status != 'cancelada'
     ORDER BY m.date ASC, m.start_time ASC
     LIMIT ?`,
    churchId,
    today,
    addDays(today, DASHBOARD_EVENTS_WINDOW_DAYS),
    DASHBOARD_EVENTS_PREVIEW,
  );

  return rows.map((row) => ({
    meetingId: row.meeting_id,
    date: row.date,
    startTime: row.start_time,
    name: row.name,
    congregationName: row.congregation_name ?? '-',
    accent: row.accent,
  }));
}

async function recentNotes(churchId: string) {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: string;
    believer_id: string;
    kind: string;
    occurred_at: string;
    told: string;
    first_name: string | null;
    last_name: string | null;
  }>(
    `SELECT n.id, n.believer_id, n.kind, n.occurred_at, n.told, b.first_name, b.last_name
     FROM believer_notes n
     LEFT JOIN believers b ON b.id = n.believer_id
     WHERE n.church_id = ? AND n.deleted_at IS NULL
     ORDER BY n.occurred_at DESC, n.created_at DESC
     LIMIT ?`,
    churchId,
    DASHBOARD_NOTES_PREVIEW,
  );

  return rows.map((row) => ({
    id: row.id,
    believerId: row.believer_id,
    believerName: row.first_name
      ? believerName({ firstName: row.first_name, lastName: row.last_name })
      : '-',
    kind: row.kind as DashboardSummary['recentNotes'][number]['kind'],
    occurredAt: row.occurred_at,
    excerpt: row.told.length > EXCERPT_LENGTH ? `${row.told.slice(0, EXCERPT_LENGTH)}.` : row.told,
  }));
}

async function composition(churchId: string) {
  const db = await getDb();
  const [people, congregations, ministries, gifts, believerMinistries, believerGifts] =
    await Promise.all([
      db.getAllAsync<{ id: string; status: string; congregation_id: string | null }>(
        'SELECT id, status, congregation_id FROM believers WHERE church_id = ? AND deleted_at IS NULL',
        churchId,
      ),
      db.getAllAsync<{ id: string; name: string; accent: string }>(
        'SELECT id, name, accent FROM congregations WHERE church_id = ? AND deleted_at IS NULL',
        churchId,
      ),
      db.getAllAsync<{ slug: string; name: string; accent: string }>(
        'SELECT slug, name, accent FROM ministries WHERE church_id = ? AND deleted_at IS NULL',
        churchId,
      ),
      db.getAllAsync<{ id: string; name: string; accent: string }>(
        'SELECT id, name, accent FROM gifts WHERE church_id = ? AND deleted_at IS NULL',
        churchId,
      ),
      db.getAllAsync<{ believer_id: string; ministry: string }>(
        `SELECT bm.believer_id, bm.ministry FROM believer_ministries bm
         JOIN believers b ON b.id = bm.believer_id
         WHERE b.church_id = ? AND b.deleted_at IS NULL AND bm.deleted_at IS NULL`,
        churchId,
      ),
      db.getAllAsync<{ believer_id: string; gift_id: string }>(
        `SELECT bg.believer_id, bg.gift_id FROM believer_gifts bg
         JOIN believers b ON b.id = bg.believer_id
         WHERE b.church_id = ? AND b.deleted_at IS NULL AND bg.deleted_at IS NULL`,
        churchId,
      ),
    ]);

  // «Activo» y «nuevo» son quien de verdad está hoy en la iglesia: a quien se
  // ha ido o se ha trasladado no lo cuenta el reparto actual (como en la API).
  const active = people.filter((one) => one.status === 'activo' || one.status === 'nuevo');
  const activeIds = new Set(active.map((one) => one.id));

  const congregationName = new Map(congregations.map((one) => [one.id, one]));
  const ministryName = new Map(ministries.map((one) => [one.slug, one]));
  const giftName = new Map(gifts.map((one) => [one.id, one]));

  const byCongregation = new Map<string, number>();
  for (const one of active) {
    if (!one.congregation_id) continue;
    byCongregation.set(one.congregation_id, (byCongregation.get(one.congregation_id) ?? 0) + 1);
  }
  const byMinistry = new Map<string, number>();
  for (const one of believerMinistries) {
    if (!activeIds.has(one.believer_id)) continue;
    byMinistry.set(one.ministry, (byMinistry.get(one.ministry) ?? 0) + 1);
  }
  const byGift = new Map<string, number>();
  for (const one of believerGifts) {
    if (!activeIds.has(one.believer_id)) continue;
    byGift.set(one.gift_id, (byGift.get(one.gift_id) ?? 0) + 1);
  }

  return {
    byCongregation: toBucket(byCongregation, (id) => ({
      label: congregationName.get(id)?.name ?? '—',
      accent: congregationName.get(id)?.accent ?? null,
    })),
    byMinistry: toBucket(byMinistry, (slug) => ({
      label: ministryName.get(slug)?.name ?? slug,
      accent: ministryName.get(slug)?.accent ?? null,
    })),
    byGift: toBucket(byGift, (id) => ({
      label: giftName.get(id)?.name ?? '—',
      accent: giftName.get(id)?.accent ?? null,
    })),
  };
}

async function weeklyActivity(churchId: string, today: IsoDate) {
  const db = await getDb();
  const currentWeek = startOfWeek(today);
  const weeks = Array.from({ length: DASHBOARD_ACTIVITY_WEEKS }, (_unused, index) =>
    addDays(currentWeek, -7 * (DASHBOARD_ACTIVITY_WEEKS - 1 - index)),
  );
  const since = weeks[0];
  if (!since) return [];

  const rows = await db.getAllAsync<{ occurred_at: string }>(
    'SELECT occurred_at FROM believer_notes WHERE church_id = ? AND deleted_at IS NULL AND occurred_at >= ?',
    churchId,
    since,
  );

  const counts = new Map<string, number>();
  for (const row of rows) {
    const week = startOfWeek(row.occurred_at);
    counts.set(week, (counts.get(week) ?? 0) + 1);
  }

  // Rellena las semanas sin ninguna nota con cero, como en la API.
  return weeks.map((week) => ({ week, notes: counts.get(week) ?? 0 }));
}

async function todayTasksAndStreak(churchId: string, ownerId: string, today: IsoDate) {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    task_id: string;
    title: string;
    time: string | null;
    priority: string;
    status: string;
  }>(
    `SELECT o.task_id, t.title, t.time, t.priority, o.status
     FROM task_occurrences o
     JOIN tasks t ON t.id = o.task_id
     WHERE t.church_id = ? AND t.owner_id = ? AND t.deleted_at IS NULL AND o.date = ?
     ORDER BY t.time IS NULL, t.time, t.title`,
    churchId,
    ownerId,
    today,
  );

  // El acento es el de su primera etiqueta, o `primary` si no lleva ninguna.
  const accents = new Map<string, string>();
  const taskIds = [...new Set(rows.map((row) => row.task_id))];
  for (const taskId of taskIds) {
    const tag = await db.getFirstAsync<{ accent: string }>(
      `SELECT tg.accent FROM task_tags tt JOIN tags tg ON tg.id = tt.tag_id
       WHERE tt.task_id = ? AND tt.deleted_at IS NULL AND tg.deleted_at IS NULL
       ORDER BY tt.created_at ASC LIMIT 1`,
      taskId,
    );
    if (tag) accents.set(taskId, tag.accent);
  }

  const tasks = rows.slice(0, DASHBOARD_TASKS_PREVIEW).map((row) => ({
    taskId: row.task_id,
    title: row.title,
    time: row.time,
    priority: row.priority as DashboardSummary['todayTasks'][number]['priority'],
    completed: row.status === 'completada',
    accent: accents.get(row.task_id) ?? 'primary',
  }));

  return { tasks, streak: await streak(churchId, ownerId, today) };
}

async function streak(churchId: string, ownerId: string, today: IsoDate): Promise<number> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ date: string; status: string }>(
    `SELECT o.date, o.status FROM task_occurrences o
     JOIN tasks t ON t.id = o.task_id
     WHERE t.church_id = ? AND t.owner_id = ? AND t.deleted_at IS NULL AND o.date >= ? AND o.date <= ?`,
    churchId,
    ownerId,
    addDays(today, -STREAK_LOOKBACK_DAYS),
    today,
  );

  const byDay = new Map<string, string[]>();
  for (const row of rows) {
    const list = byDay.get(row.date) ?? [];
    list.push(row.status);
    byDay.set(row.date, list);
  }

  // Se recorre hacia atrás desde ayer (D8 de la API): un día sin ocurrencias
  // no corta la racha; un día con alguna sin completar, sí. Hoy se suma aparte.
  let streak = 0;
  for (let offset = 1; offset <= STREAK_LOOKBACK_DAYS; offset++) {
    const statuses = byDay.get(addDays(today, -offset));
    if (!statuses || statuses.length === 0) continue;
    if (statuses.some((status) => status !== 'completada')) break;
    streak++;
  }

  const todayStatuses = byDay.get(today);
  if (todayStatuses && todayStatuses.length > 0 && todayStatuses.every((s) => s === 'completada')) {
    streak++;
  }

  return streak;
}

/**
 * El total de creyentes registrados en la **aplicación** (todas las iglesias
 * locales, no solo la activa): es la cifra grande del hero. En el modo
 * conectado (Fase 3) la sustituye el dato del servidor.
 */
export async function registeredBelievers(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ total: number }>(
    'SELECT COUNT(*) AS total FROM believers WHERE deleted_at IS NULL',
  );
  return row?.total ?? 0;
}

export const localDashboardRepository: DashboardRepository = {
  async summary(churchId, ownerId): Promise<DashboardSummary> {
    const today = todayIso();
    const [
      believers,
      attention,
      upcomingEvents_,
      recentNotes_,
      composition_,
      weeklyActivity_,
      todayTasks_,
    ] = await Promise.all([
      believersSummary(churchId, today),
      attentionPeople(churchId, today),
      upcomingEvents(churchId, today),
      recentNotes(churchId),
      composition(churchId),
      weeklyActivity(churchId, today),
      todayTasksAndStreak(churchId, ownerId, today),
    ]);

    return {
      believers: { total: believers.total, newThisMonth: believers.newThisMonth },
      attention: { count: believers.needsAttention, people: attention },
      upcomingEvents: upcomingEvents_,
      recentNotes: recentNotes_,
      composition: composition_,
      weeklyActivity: weeklyActivity_,
      todayTasks: todayTasks_.tasks,
      taskStreak: todayTasks_.streak,
    };
  },
};
