import { z } from 'zod';

import { isoDateSchema, reminderAtSchema, timeSchema } from './common';
import { tagRefSchema } from './tags';

/** RFC 0018 §5.2, D1: la tarea es su propia entidad, con tres estados y prioridad. */
export const TASK_PRIORITIES = ['baja', 'media', 'alta'] as const;

export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const DEFAULT_TASK_PRIORITY: TaskPriority = 'media';

export const TASK_STATUSES = ['pendiente', 'en_progreso', 'completada'] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

/** Sin `RRULE` (D2): solo estas tres frecuencias, con un intervalo en días/semanas/meses. */
export const TASK_REPEAT_FREQS = ['diaria', 'semanal', 'mensual'] as const;

export type TaskRepeatFreq = (typeof TASK_REPEAT_FREQS)[number];

export const TASK_REPEAT_END_TYPES = ['nunca', 'fecha', 'cantidad'] as const;

export type TaskRepeatEndType = (typeof TASK_REPEAT_END_TYPES)[number];

/** El recordatorio de una tarea: 1:1, con sus propias etiquetas (D10, D11). */
export const taskReminderSchema = z.object({
  enabled: z.boolean(),
  remindAt: z.string(),
  tags: z.array(tagRefSchema),
});

export type TaskReminder = z.infer<typeof taskReminderSchema>;

/**
 * Una ocurrencia de tarea, ya expandida (§5.4, D3): el día concreto de una
 * tarea puntual o repetitiva, materializada en `task_occurrences` o todavía
 * una propuesta calculada al vuelo. `date` es siempre el día que se está
 * mirando, no necesariamente el `date` de la plantilla.
 */
export const taskOccurrenceSchema = z.object({
  taskId: z.uuid(),
  date: isoDateSchema,
  title: z.string(),
  description: z.string().nullable(),
  time: z.string().nullable(),
  priority: z.enum(TASK_PRIORITIES),
  status: z.enum(TASK_STATUSES),
  completedAt: z.string().nullable(),
  isRecurring: z.boolean(),
  tags: z.array(tagRefSchema),
  reminder: taskReminderSchema.nullable(),
  createdAt: z.string(),
});

export type TaskOccurrence = z.infer<typeof taskOccurrenceSchema>;

/**
 * La plantilla entera de una tarea, para el formulario de edición (§9.6): a
 * diferencia de `TaskOccurrence`, trae la repetición completa. `date` es
 * siempre la de la plantilla, no la del día que se esté mirando.
 */
export const taskSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  description: z.string().nullable(),
  date: isoDateSchema,
  time: z.string().nullable(),
  priority: z.enum(TASK_PRIORITIES),
  isRecurring: z.boolean(),
  repeatFreq: z.enum(TASK_REPEAT_FREQS).nullable(),
  repeatInterval: z.number().int(),
  repeatEndType: z.enum(TASK_REPEAT_END_TYPES).nullable(),
  repeatEndDate: isoDateSchema.nullable(),
  repeatEndCount: z.number().int().nullable(),
  status: z.enum(TASK_STATUSES).nullable(),
  completedAt: z.string().nullable(),
  tags: z.array(tagRefSchema),
  reminder: taskReminderSchema.nullable(),
});

export type Task = z.infer<typeof taskSchema>;

export const createTaskSchema = z
  .object({
    title: z.string().trim().min(1, 'Ponle un título a la tarea').max(200),
    description: z.string().trim().max(4000).optional(),
    date: isoDateSchema,
    time: timeSchema.nullable().optional(),
    priority: z.enum(TASK_PRIORITIES).default(DEFAULT_TASK_PRIORITY),
    isRecurring: z.boolean().default(false),
    repeatFreq: z.enum(TASK_REPEAT_FREQS).optional(),
    repeatInterval: z.number().int().min(1).max(365).default(1),
    repeatEndType: z.enum(TASK_REPEAT_END_TYPES).optional(),
    repeatEndDate: isoDateSchema.optional(),
    repeatEndCount: z.number().int().min(1).max(999).optional(),
    tagIds: z.array(z.uuid()).max(20).default([]),
    reminderEnabled: z.boolean().default(true),
    reminderAt: reminderAtSchema.optional(),
    reminderTagIds: z.array(z.uuid()).max(20).default([]),
  })
  .refine((task) => !task.isRecurring || Boolean(task.repeatFreq), {
    message: 'Una tarea repetitiva necesita una frecuencia',
    path: ['repeatFreq'],
  })
  .refine((task) => task.repeatEndType !== 'fecha' || Boolean(task.repeatEndDate), {
    message: 'Falta hasta cuándo se repite',
    path: ['repeatEndDate'],
  })
  .refine((task) => task.repeatEndType !== 'cantidad' || Boolean(task.repeatEndCount), {
    message: 'Falta cuántas veces se repite',
    path: ['repeatEndCount'],
  });

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

/** Sin `refine`: al editar puede llegar solo un campo. */
export const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(4000).nullable().optional(),
  date: isoDateSchema.optional(),
  time: timeSchema.nullable().optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  isRecurring: z.boolean().optional(),
  repeatFreq: z.enum(TASK_REPEAT_FREQS).nullable().optional(),
  repeatInterval: z.number().int().min(1).max(365).optional(),
  repeatEndType: z.enum(TASK_REPEAT_END_TYPES).nullable().optional(),
  repeatEndDate: isoDateSchema.nullable().optional(),
  repeatEndCount: z.number().int().min(1).max(999).nullable().optional(),
  tagIds: z.array(z.uuid()).max(20).optional(),
  reminderEnabled: z.boolean().optional(),
  reminderAt: reminderAtSchema.nullable().optional(),
  reminderTagIds: z.array(z.uuid()).max(20).optional(),
});

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const setOccurrenceStatusSchema = z.object({
  status: z.enum(TASK_STATUSES),
});

export type SetOccurrenceStatusInput = z.infer<typeof setOccurrenceStatusSchema>;

/** Racha actual y más larga (§6, D8, D9). */
export const taskStreakSchema = z.object({
  current: z.number().int(),
  longest: z.number().int(),
});

export type TaskStreak = z.infer<typeof taskStreakSchema>;
