import { z } from 'zod';

import { isoDateSchema } from './common';

/**
 * El seguimiento de tiempo de una tarea (Fase 7c): cada vez que se pulsa
 * «empezar» nace una entrada, y «parar» la cierra. Una persona solo tiene un
 * cronómetro en marcha a la vez. La duración **se calcula**, no se guarda.
 */
export const taskTimeEntrySchema = z.object({
    id: z.uuid(),
    taskId: z.uuid(),
    /** Instante ISO. */
    startedAt: z.string(),
    /** Instante ISO; nulo mientras el cronómetro corre. */
    endedAt: z.string().nullable(),
});

export type TaskTimeEntry = z.infer<typeof taskTimeEntrySchema>;

/** El cronómetro en marcha, con lo justo de su tarea para pintarlo en cualquier pantalla. */
export const runningTimerSchema = z.object({
    entry: taskTimeEntrySchema,
    task: z.object({ id: z.uuid(), title: z.string() }),
});

export type RunningTimer = z.infer<typeof runningTimerSchema>;

/**
 * La respuesta de «¿hay un cronómetro en marcha?». Va envuelta porque un
 * `null` pelado llega al cliente como cuerpo vacío, y eso no se distingue de
 * un fallo.
 */
export const runningTimerStateSchema = z.object({ timer: runningTimerSchema.nullable() });

export type RunningTimerState = z.infer<typeof runningTimerStateSchema>;

/** Las entradas de una tarea, con el total de las ya cerradas. */
export const taskTimeSchema = z.object({
    entries: z.array(taskTimeEntrySchema),
    totalSeconds: z.number().int().min(0),
});

export type TaskTime = z.infer<typeof taskTimeSchema>;

/** El tiempo del rango por tarea y por flujo; el cronómetro en marcha no cuenta hasta cerrarse. */
export const taskTimeSummarySchema = z.object({
    from: isoDateSchema,
    to: isoDateSchema,
    totalSeconds: z.number().int().min(0),
    byTask: z.array(
        z.object({ taskId: z.uuid(), title: z.string(), seconds: z.number().int().min(0) }),
    ),
    byWorkflow: z.array(
        z.object({
            workflowId: z.uuid().nullable(),
            name: z.string().nullable(),
            accent: z.string().nullable(),
            seconds: z.number().int().min(0),
        }),
    ),
});

export type TaskTimeSummary = z.infer<typeof taskTimeSummarySchema>;
