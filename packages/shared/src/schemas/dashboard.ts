import { z } from 'zod';

import { noteKindSchema } from './believer-notes';
import { isoDateSchema, timeSchema } from './common';
import { TASK_PRIORITIES } from './tasks';

/** Igual que el de las listas (`bucketSchema` en `list-stats.ts`): sede, labor o
 * don con su color y su cuenta. Se repite porque una cuenta es de **toda la
 * iglesia** y la otra de **una lista**; si aparece un tercer sitio que la
 * necesite, es entonces cuando se extrae (Regla 1 §5). */
const dashboardBucketSchema = z.object({
  label: z.string(),
  accent: z.string(),
  count: z.number().int(),
});

export type DashboardBucket = z.infer<typeof dashboardBucketSchema>;

/** Quién pide atención, con lo justo para la fila de la tarjeta (D-panel-1). */
export const dashboardAttentionPersonSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  hasPhoto: z.boolean(),
  daysWithoutNote: z.number().int(),
});

export type DashboardAttentionPerson = z.infer<typeof dashboardAttentionPersonSchema>;

/** Un hueco de la agenda de los próximos días, ya resuelto para no repetir la
 * expansión de patrones en la portada (D-panel-2). */
export const dashboardEventSchema = z.object({
  meetingId: z.uuid().nullable(),
  date: isoDateSchema,
  startTime: timeSchema,
  name: z.string(),
  congregationName: z.string(),
  accent: z.string(),
});

export type DashboardEvent = z.infer<typeof dashboardEventSchema>;

/** Una entrada de la bitácora, recortada para la tarjeta. */
export const dashboardNoteSchema = z.object({
  id: z.uuid(),
  believerId: z.uuid(),
  believerName: z.string(),
  kind: noteKindSchema,
  occurredAt: isoDateSchema,
  excerpt: z.string(),
});

export type DashboardNote = z.infer<typeof dashboardNoteSchema>;

/** Notas escritas esa semana; el lunes de la semana identifica el punto. */
export const dashboardWeekActivitySchema = z.object({
  week: isoDateSchema,
  notes: z.number().int(),
});

export type DashboardWeekActivity = z.infer<typeof dashboardWeekActivitySchema>;

/** Una tarea de hoy, recortada para la tarjeta (RFC 0018 §9.7). */
export const dashboardTaskSchema = z.object({
  taskId: z.uuid(),
  title: z.string(),
  time: timeSchema.nullable(),
  priority: z.enum(TASK_PRIORITIES),
  completed: z.boolean(),
  /** El de su primera etiqueta, o `primary` si no lleva ninguna. */
  accent: z.string(),
});

export type DashboardTask = z.infer<typeof dashboardTaskSchema>;

/**
 * Todo lo del panel de inicio, en una sola respuesta (RFC 0001).
 *
 * Una llamada y no una por tarjeta: en móvil con mala cobertura, cinco
 * peticiones en paralelo son cinco oportunidades de fallar.
 */
export const dashboardSummarySchema = z.object({
  believers: z.object({ total: z.number().int(), newThisMonth: z.number().int() }),
  attention: z.object({
    count: z.number().int(),
    people: z.array(dashboardAttentionPersonSchema),
  }),
  upcomingEvents: z.array(dashboardEventSchema),
  recentNotes: z.array(dashboardNoteSchema),
  composition: z.object({
    byCongregation: z.array(dashboardBucketSchema),
    byMinistry: z.array(dashboardBucketSchema),
    byGift: z.array(dashboardBucketSchema),
  }),
  weeklyActivity: z.array(dashboardWeekActivitySchema),
  /** Hasta cinco tareas de hoy, y la racha (RFC 0018 §9.7). Sin petición aparte. */
  todayTasks: z.array(dashboardTaskSchema),
  taskStreak: z.number().int(),
});

export type DashboardSummary = z.infer<typeof dashboardSummarySchema>;

/** Cuántas filas trae cada vista previa: la tarjeta enlaza al listado para ver el resto. */
export const DASHBOARD_ATTENTION_PREVIEW = 5;
export const DASHBOARD_EVENTS_PREVIEW = 5;
export const DASHBOARD_NOTES_PREVIEW = 5;
/** Cuántas semanas dibuja la gráfica de actividad: mes y medio, sin volverse un informe histórico. */
export const DASHBOARD_ACTIVITY_WEEKS = 6;
/** Cuántos días de agenda se miran para sacar los próximos eventos. */
export const DASHBOARD_EVENTS_WINDOW_DAYS = 30;
/** Cuántas tareas de hoy trae la tarjeta (RFC 0018 §9.7). */
export const DASHBOARD_TASKS_PREVIEW = 5;
