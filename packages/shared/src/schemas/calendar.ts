import { z } from 'zod';

import { believerSchema } from './believers';
import { isoDateSchema, timeSchema } from './common';
import { congregationSchema } from './congregations';
import { MAX_PHASES } from './patterns';

/**
 * El tramo más largo que se puede pedir de una vez: el mes visible más el
 * anterior y el siguiente, que es lo que precarga la interfaz. Sin tope, una
 * petición sin filtros expandiría patrones hasta el infinito.
 */
export const MAX_CALENDAR_RANGE_DAYS = 92;

export const MEETING_STATUSES = ['programada', 'cancelada'] as const;

export type MeetingStatus = (typeof MEETING_STATUSES)[number];

/** Quién ocupa una fase, con el nombre ya compuesto para pintarlo tal cual. */
export const slotBelieverSchema = z.object({ id: z.uuid(), name: z.string() });

/**
 * Una **fase** y quién la ocupa. Es la unidad real de este calendario: lo que
 * se toca, lo que se comparte y lo que puede estar vacío (RFC 0002 D1).
 *
 * `id` nulo significa que la reunión todavía es una propuesta del patrón y no
 * existe en la base de datos.
 */
export const meetingSlotSchema = z.object({
  id: z.uuid().nullable(),
  name: z.string(),
  position: z.number().int(),
  note: z.string().nullable(),
  believer: slotBelieverSchema.nullable(),
});

export type MeetingSlot = z.infer<typeof meetingSlotSchema>;

export const meetingSchema = z.object({
  /** Nulo mientras sea una propuesta del patrón, sin fila propia (D3). */
  id: z.uuid().nullable(),
  congregationId: z.uuid(),
  patternId: z.uuid().nullable(),
  name: z.string(),
  startTime: z.string(),
  accent: z.string(),
  status: z.enum(MEETING_STATUSES),
  notes: z.string().nullable(),
  slots: z.array(meetingSlotSchema),
});

export type Meeting = z.infer<typeof meetingSchema>;

export const calendarDaySchema = z.object({
  date: isoDateSchema,
  meetings: z.array(meetingSchema),
});

export type CalendarDay = z.infer<typeof calendarDaySchema>;

/**
 * Lo que devuelve el calendario para un tramo: los días con sus reuniones
 * —reales o propuestas— y, una sola vez, las sedes con su nombre y su color.
 */
export const calendarRangeSchema = z.object({
  from: isoDateSchema,
  to: isoDateSchema,
  congregations: z.array(congregationSchema),
  days: z.array(calendarDaySchema),
});

export type CalendarRange = z.infer<typeof calendarRangeSchema>;

/**
 * Asignar es la primitiva (D4): con `patternId` y `date` basta, y si la
 * reunión de ese día todavía no existía la crea el servidor a partir del
 * patrón, en la misma transacción.
 */
export const assignSlotSchema = z.object({
  date: isoDateSchema,
  patternId: z.uuid().optional(),
  meetingId: z.uuid().optional(),
  position: z.number().int().min(0).max(MAX_PHASES),
  believerId: z.uuid().nullable(),
  note: z.string().trim().max(160).nullable().optional(),
});

export type AssignSlotInput = z.infer<typeof assignSlotSchema>;

/** Una reunión puntual: la que no nace de ningún patrón. */
export const createMeetingSchema = z.object({
  congregationId: z.uuid(),
  date: isoDateSchema,
  startTime: timeSchema,
  name: z.string().trim().min(2).max(80),
  phases: z
    .array(z.object({ name: z.string().trim().min(1).max(60) }))
    .min(1)
    .max(MAX_PHASES),
});

export type CreateMeetingInput = z.infer<typeof createMeetingSchema>;

export const updateMeetingSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  startTime: timeSchema.optional(),
  notes: z.string().trim().max(500).nullable().optional(),
  status: z.enum(MEETING_STATUSES).optional(),
  congregationId: z.uuid().optional(),
});

export type UpdateMeetingInput = z.infer<typeof updateMeetingSchema>;

/** Reemplaza la lista de fases entera: añadir, quitar y reordenar es una sola acción. */
export const setMeetingSlotsSchema = z.object({
  slots: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(60),
        believerId: z.uuid().nullable().optional(),
        note: z.string().trim().max(160).nullable().optional(),
      }),
    )
    .min(1)
    .max(MAX_PHASES),
});

export type SetMeetingSlotsInput = z.infer<typeof setMeetingSlotsSchema>;

/**
 * Un candidato para el selector, con lo único que hace falta para decidir:
 * cuándo subió por última vez y cuántas veces lleva en el tramo que se está
 * mirando. Ordenado por quien lleva más tiempo sin subir.
 */
export const preacherSchema = believerSchema
  .pick({ id: true, congregationId: true, ministries: true })
  .extend({
    name: z.string(),
    lastDate: isoDateSchema.nullable(),
    timesInRange: z.number().int(),
  });

export type Preacher = z.infer<typeof preacherSchema>;

export const CALENDAR_WARNINGS = [
  /** Una fase de una reunión ya materializada sin nadie asignado. */
  'unassigned',
  /** La misma persona en dos fases del mismo día. */
  'twiceSameDay',
  /** La misma persona en días consecutivos. */
  'backToBack',
  /** La misma persona en dos sedes el mismo día. */
  'twoVenues',
] as const;

export type CalendarWarningKind = (typeof CALENDAR_WARNINGS)[number];

export const calendarWarningSchema = z.object({
  kind: z.enum(CALENDAR_WARNINGS),
  date: isoDateSchema,
  believerId: z.uuid().nullable(),
  believerName: z.string().nullable(),
  congregationId: z.uuid().nullable(),
  detail: z.string(),
});

export type CalendarWarning = z.infer<typeof calendarWarningSchema>;

export const preacherBalanceSchema = z.object({
  believerId: z.uuid(),
  name: z.string(),
  times: z.number().int(),
  lastDate: isoDateSchema.nullable(),
  congregationIds: z.array(z.uuid()),
});

export type PreacherBalance = z.infer<typeof preacherBalanceSchema>;

export const calendarSummarySchema = z.object({
  from: isoDateSchema,
  to: isoDateSchema,
  people: z.array(preacherBalanceSchema),
  warnings: z.array(calendarWarningSchema),
});

export type CalendarSummary = z.infer<typeof calendarSummarySchema>;
