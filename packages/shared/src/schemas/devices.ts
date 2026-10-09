import { z } from 'zod';

/** Minutos de vida de un token de vinculación (Fase 1 del plan de sincronización). */
export const DEVICE_LINK_TTL_MINUTES = 10;

/** Versión del protocolo que el servidor declara en `GET /sync/capabilities`. */
export const SYNC_PROTOCOL_VERSION = 1;

/**
 * Lo que el móvil lee antes de enseñar ninguna credencial: a quién se va a
 * vincular. Es público a propósito, y por eso no lleva datos de nadie.
 */
export const syncCapabilitiesSchema = z.object({
    installationName: z.string(),
    protocolVersion: z.number().int(),
    /** El token se canjea para vincular; la transferencia de datos llega en fases posteriores. */
    dataSyncEnabled: z.boolean(),
    linkTtlMinutes: z.number().int(),
});

export type SyncCapabilities = z.infer<typeof syncCapabilitiesSchema>;

/** El token solo se devuelve aquí, una vez: en base de datos queda su huella. */
export const deviceLinkSchema = z.object({
    token: z.string(),
    expiresAt: z.coerce.date(),
    /** Dónde tiene que apuntar el móvil. */
    apiUrl: z.string(),
    installationName: z.string(),
    accountEmail: z.string(),
});

export type DeviceLink = z.infer<typeof deviceLinkSchema>;

export const exchangeDeviceLinkSchema = z.object({
    token: z.string().min(16).max(128),
    deviceName: z.string().trim().min(1).max(80),
});

export type ExchangeDeviceLinkInput = z.infer<typeof exchangeDeviceLinkSchema>;

export const deviceSchema = z.object({
    id: z.uuid(),
    name: z.string(),
    createdAt: z.coerce.date(),
    lastSeenAt: z.coerce.date().nullable(),
    /** Verdadero en la entrada del dispositivo que hace la petición. */
    current: z.boolean(),
});

export type Device = z.infer<typeof deviceSchema>;

/** La credencial del dispositivo, devuelta una sola vez al canjear el token. */
export const deviceCredentialSchema = z.object({
    credential: z.string(),
    device: deviceSchema,
    account: z.object({ id: z.string(), name: z.string(), email: z.string() }),
});

export type DeviceCredential = z.infer<typeof deviceCredentialSchema>;
