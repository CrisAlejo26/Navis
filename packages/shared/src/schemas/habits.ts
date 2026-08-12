import { z } from 'zod';

import { isoDateSchema, reminderAtSchema, timeSchema } from './common';
import { tagRefSchema } from './tags';

/** RFC 0018 §5.3, D5: dos estados, no tres — un hábito se hizo o no. */
export const HABIT_STATUSES = ['pendiente', 'completada'] as const;

export type HabitStatus = (typeof HABIT_STATUSES)[number];

/** Repetición simple (Alcance): sin intervalo ni condición de fin, al revés que la tarea. */
export const HABIT_REPEAT_FREQS = ['ninguna', 'diaria', 'semanal', 'mensual'] as const;

export type HabitRepeatFreq = (typeof HABIT_REPEAT_FREQS)[number];

export const DEFAULT_HABIT_REPEAT_FREQ: HabitRepeatFreq = 'ninguna';

export const habitReminderSchema = z.object({
  enabled: z.boolean(),
  remindAt: z.string(),
  tags: z.array(tagRefSchema),
});

export type HabitReminder = z.infer<typeof habitReminderSchema>;

/** Una ocurrencia de hábito, expandida igual que la de tarea (§5.4, D3). */
export const habitOccurrenceSchema = z.object({
  habitId: z.uuid(),
  date: isoDateSchema,
  title: z.string(),
  goal: z.string().nullable(),
  description: z.string().nullable(),
  time: z.string().nullable(),
  status: z.enum(HABIT_STATUSES),
  completedAt: z.string().nullable(),
  isRecurring: z.boolean(),
  tags: z.array(tagRefSchema),
  reminder: habitReminderSchema.nullable(),
  createdAt: z.string(),
});

export type HabitOccurrence = z.infer<typeof habitOccurrenceSchema>;

/** La plantilla entera de un hábito, para el formulario de edición (§9.6). */
export const habitSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  goal: z.string().nullable(),
  description: z.string().nullable(),
  date: isoDateSchema,
  time: z.string().nullable(),
  repeatFreq: z.enum(HABIT_REPEAT_FREQS),
  status: z.enum(HABIT_STATUSES).nullable(),
  completedAt: z.string().nullable(),
  tags: z.array(tagRefSchema),
  reminder: habitReminderSchema.nullable(),
});

export type Habit = z.infer<typeof habitSchema>;

export const createHabitSchema = z.object({
  title: z.string().trim().min(1, 'Ponle un título al hábito').max(200),
  goal: z.string().trim().max(200).optional(),
  description: z.string().trim().max(4000).optional(),
  date: isoDateSchema,
  time: timeSchema.nullable().optional(),
  repeatFreq: z.enum(HABIT_REPEAT_FREQS).default(DEFAULT_HABIT_REPEAT_FREQ),
  tagIds: z.array(z.uuid()).max(20).default([]),
  reminderEnabled: z.boolean().default(true),
  reminderAt: reminderAtSchema.optional(),
  reminderTagIds: z.array(z.uuid()).max(20).default([]),
});

export type CreateHabitInput = z.infer<typeof createHabitSchema>;

export const updateHabitSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  goal: z.string().trim().max(200).nullable().optional(),
  description: z.string().trim().max(4000).nullable().optional(),
  date: isoDateSchema.optional(),
  time: timeSchema.nullable().optional(),
  repeatFreq: z.enum(HABIT_REPEAT_FREQS).optional(),
  tagIds: z.array(z.uuid()).max(20).optional(),
  reminderEnabled: z.boolean().optional(),
  reminderAt: reminderAtSchema.nullable().optional(),
  reminderTagIds: z.array(z.uuid()).max(20).optional(),
});

export type UpdateHabitInput = z.infer<typeof updateHabitSchema>;

export const setHabitOccurrenceStatusSchema = z.object({
  status: z.enum(HABIT_STATUSES),
});

export type SetHabitOccurrenceStatusInput = z.infer<typeof setHabitOccurrenceStatusSchema>;
