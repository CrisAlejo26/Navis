import { z } from 'zod';

import { accentSchema } from './congregations';

/**
 * Un flujo de trabajo (Fase 7b): un grupo con nombre y color al que se asigna
 * una tarea, por cuenta y por iglesia. Mismo patrón que las etiquetas, con
 * descripción y sin icono; el color sale de `accentSchema` (token o
 * hexadecimal), no de una paleta propia.
 */
export const workflowSchema = z.object({
    id: z.uuid(),
    name: z.string(),
    description: z.string().nullable(),
    accent: z.string(),
    position: z.number().int(),
});

export type Workflow = z.infer<typeof workflowSchema>;

/** El mismo flujo, con cuántas tareas lo llevan. */
export const workflowWithCountSchema = workflowSchema.extend({ count: z.number().int() });

export type WorkflowWithCount = z.infer<typeof workflowWithCountSchema>;

/** Lo que hace falta para pintarlo en una tarjeta o un chip. */
export const workflowRefSchema = workflowSchema.pick({ id: true, name: true, accent: true });

export type WorkflowRef = z.infer<typeof workflowRefSchema>;

export const createWorkflowSchema = z.object({
    name: z.string().trim().min(1, 'El flujo necesita un nombre').max(40),
    description: z.string().trim().max(200).nullable().optional(),
    accent: accentSchema,
});

export type CreateWorkflowInput = z.infer<typeof createWorkflowSchema>;

export const updateWorkflowSchema = createWorkflowSchema.partial();

export type UpdateWorkflowInput = z.infer<typeof updateWorkflowSchema>;
