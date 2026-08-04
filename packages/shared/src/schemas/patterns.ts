import { z } from 'zod';

import { isoDateSchema, timeSchema } from './common';
import { accentSchema } from './congregations';

/** Domingo es 0, como en `Date.getDay()`. */
export const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const;

export type Weekday = (typeof WEEKDAYS)[number];

/** Ninguna reunión de una iglesia tiene veinte fases; el tope evita el disparate. */
export const MAX_PHASES = 20;

export const patternPhaseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  position: z.number().int(),
});

export type PatternPhase = z.infer<typeof patternPhaseSchema>;

/**
 * La reunión fija de un día de la semana en una sede: «los viernes en Elda a
 * las 20:00, con estas fases».
 *
 * Sustituye a la `RRULE` de la primera versión del RFC: aquí las reuniones son
 * semanales de verdad, y un día de la semana con una hora cubre el caso entero
 * (RFC 0002 D2).
 */
export const meetingPatternSchema = z.object({
  id: z.uuid(),
  churchId: z.uuid(),
  congregationId: z.uuid(),
  name: z.string(),
  weekday: z.number().int().min(0).max(6),
  startTime: z.string(),
  accent: z.string(),
  isActive: z.boolean(),
  /** Desde y hasta cuándo se propone. Nulo es «siempre». */
  validFrom: isoDateSchema.nullable(),
  validTo: isoDateSchema.nullable(),
  phases: z.array(patternPhaseSchema),
});

export type MeetingPattern = z.infer<typeof meetingPatternSchema>;

const phaseInputSchema = z.object({
  name: z.string().trim().min(1, 'La fase necesita un nombre').max(60),
});

export const createPatternSchema = z.object({
  congregationId: z.uuid(),
  name: z.string().trim().min(2, 'La reunión necesita un nombre').max(80),
  weekday: z.number().int().min(0).max(6),
  startTime: timeSchema,
  accent: accentSchema.optional(),
  validFrom: isoDateSchema.nullable().optional(),
  validTo: isoDateSchema.nullable().optional(),
  phases: z.array(phaseInputSchema).min(1, 'Hace falta al menos una fase').max(MAX_PHASES),
});

export type CreatePatternInput = z.infer<typeof createPatternSchema>;

export const updatePatternSchema = createPatternSchema
  .omit({ congregationId: true })
  .partial()
  .extend({ isActive: z.boolean().optional() });

export type UpdatePatternInput = z.infer<typeof updatePatternSchema>;
