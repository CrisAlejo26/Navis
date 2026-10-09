/**
 * Los estados de la conexión del teléfono con una instalación (Fase 0 del plan
 * de sincronización). Los que todavía no se alcanzan —pausa, conflictos…— ya
 * tienen nombre y texto para que las fases siguientes no tengan que reabrir el
 * contrato de la interfaz.
 */
export const SYNC_STATES = [
    'local',
    'linking',
    'connected',
    'offline',
    'paused',
    'needsAuth',
    'conflicts',
    'disconnecting',
] as const;

export type SyncState = (typeof SYNC_STATES)[number];
