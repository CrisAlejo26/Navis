import { z } from 'zod';
import { isoDateSchema } from './common';

const weekday = z.number().int().min(0).max(6);
export const taskRepeatOptionsSchema = z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('weekdays'), weekdays: z.array(weekday).min(1).max(7).refine((v) => new Set(v).size === v.length) }),
    z.object({ kind: z.literal('monthDay'), day: z.number().int().min(1).max(31) }),
    z.object({ kind: z.literal('monthWeekday'), week: z.union([z.literal(-1), z.number().int().min(1).max(4)]), weekday }),
    z.object({ kind: z.literal('dates'), dates: z.array(isoDateSchema).min(1).max(999).refine((v) => new Set(v).size === v.length).transform((v) => [...v].sort()) }),
]);
export type TaskRepeatOptions = z.infer<typeof taskRepeatOptionsSchema>;
export const taskRepeatPauseSchema = z.object({ from: isoDateSchema, to: isoDateSchema.nullable() }).refine((v) => !v.to || v.to >= v.from);
export type TaskRepeatPause = z.infer<typeof taskRepeatPauseSchema>;
export const taskSeriesActionSchema = z.object({ action: z.enum(['pause', 'resume', 'finish']), date: isoDateSchema });
export type TaskSeriesActionInput = z.infer<typeof taskSeriesActionSchema>;
export const taskOrderSchema = z.object({ ids: z.array(z.uuid()).min(1).max(1000).refine((v) => new Set(v).size === v.length) });
export type TaskOrderInput = z.infer<typeof taskOrderSchema>;

/** Reject mismatched advanced options after merging PATCH with the stored template. */
export function validTaskRepeat(task: { isRecurring: boolean; repeatFreq?: string | null; repeatOptions?: TaskRepeatOptions | null; date: string }): boolean {
    if (!task.isRecurring) return true;
    const options = task.repeatOptions;
    if (task.repeatFreq === 'fechas') return options?.kind === 'dates' && options.dates.every((date) => date >= task.date);
    if (!options) return true;
    return (task.repeatFreq === 'semanal' && options.kind === 'weekdays') ||
        (task.repeatFreq === 'mensual' && (options.kind === 'monthDay' || options.kind === 'monthWeekday'));
}
