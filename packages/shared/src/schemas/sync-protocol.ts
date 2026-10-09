import { z } from 'zod';

/** Una modificación publicada por el servidor, ya filtrada por lo que la cuenta puede ver. */
export const syncChangeSchema = z.object({
    position: z.number().int().positive(),
    table: z.string(),
    id: z.string(),
    op: z.enum(['upsert', 'delete']),
    /** Revisión de la entidad tras este cambio: el cliente descarta lo más viejo que ya tiene. */
    revision: z.number().int().positive(),
    /** Estado actual de la fila con la forma del protocolo (`encodeRow`); nulo en los borrados. */
    row: z.record(z.string(), z.unknown()).nullable(),
});

export type SyncChange = z.infer<typeof syncChangeSchema>;

export const syncChangesQuerySchema = z.object({
    cursor: z.coerce.number().int().min(0).default(0),
    limit: z.coerce.number().int().min(1).max(500).default(200),
    /** La generación con la que el cliente guardó su cursor; si no coincide, hay que rehacer la base. */
    generation: z.string().optional(),
});

export type SyncChangesQuery = z.infer<typeof syncChangesQuerySchema>;

export const syncChangesPageSchema = z.object({
    generation: z.string(),
    changes: z.array(syncChangeSchema),
    /** Desde aquí se pide la página siguiente; con `hasMore = false` es el punto al día. */
    nextCursor: z.number().int().min(0),
    hasMore: z.boolean(),
});

export type SyncChangesPage = z.infer<typeof syncChangesPageSchema>;

/** Una operación del cliente. El `operationId` la hace idempotente: repetirla no la ejecuta dos veces. */
export const syncOperationSchema = z.object({
    operationId: z.uuid(),
    table: z.string(),
    id: z.string(),
    op: z.enum(['upsert', 'delete']),
    /** Revisión sobre la que el cliente hizo su cambio; 0 para una alta. */
    baseRevision: z.number().int().min(0),
    fields: z.record(z.string(), z.unknown()).optional(),
});

export type SyncOperation = z.infer<typeof syncOperationSchema>;

export const syncOperationResultSchema = z.object({
    operationId: z.uuid(),
    status: z.enum(['applied', 'duplicate', 'conflict', 'rejected']),
    /** Revisión resultante cuando se aplicó. */
    revision: z.number().int().positive().optional(),
    reason: z.string().optional(),
});

export type SyncOperationResult = z.infer<typeof syncOperationResultSchema>;

export const syncOperationsRequestSchema = z.object({
    operations: z.array(syncOperationSchema).min(1).max(100),
});

export type SyncOperationsRequest = z.infer<typeof syncOperationsRequestSchema>;
