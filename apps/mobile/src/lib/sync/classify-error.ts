import { ApiError } from '@navis/api-client';
import { ZodError } from 'zod';

/**
 * Qué significa un fallo para el motor. Cada clase se trata distinto:
 * - `offline`: sin red o servidor caído; se conserva todo y se reintenta con espera.
 * - `needsAuth`: la credencial ya no vale; se detiene el transporte y se pide entrar.
 * - `forbidden`: el servidor no lo permite (sincronización apagada, permisos); se pausa.
 * - `rebase`: el cursor o la instalación ya no valen; hay que volver a descargar.
 * - `invalid`: el servidor respondió algo que no cumple el contrato.
 */
export type SyncFailure = 'offline' | 'needsAuth' | 'forbidden' | 'rebase' | 'invalid';

export function classifyError(error: unknown): SyncFailure {
    if (error instanceof ApiError) {
        if (error.isNetwork) return 'offline';
        if (error.status === 401) return 'needsAuth';
        if (error.status === 403) return 'forbidden';
        if (error.status === 409) return 'rebase';
        if (error.status >= 500) return 'offline';
        return 'invalid';
    }
    if (error instanceof ZodError) return 'invalid';
    // `fetch` de React Native lanza un TypeError cuando no hay red (portal cautivo incluido).
    if (error instanceof TypeError) return 'offline';
    return 'invalid';
}
