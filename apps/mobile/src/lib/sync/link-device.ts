import { ApiError, createApiClient } from '@navis/api-client';
import {
    SYNC_PROTOCOL_VERSION,
    deviceCredentialSchema,
    normalizeApiUrl,
    syncCapabilitiesSchema,
    type DeviceCredential,
    type SyncCapabilities,
} from '@navis/shared';

export type LinkErrorCode =
    | 'invalidUrl'
    | 'insecureUrl'
    | 'unreachable'
    | 'incompatible'
    | 'invalidToken'
    | 'safetyFailed'
    | 'generic';

export type LinkResult<T> = { ok: true; value: T } | { ok: false; error: LinkErrorCode };

interface Options {
    /** `http` solo en desarrollo: el token y la credencial viajarían en claro. */
    allowHttp: boolean;
    fetchImpl?: typeof fetch;
}

/**
 * Una redirección podría llevar el token a otro anfitrión: se corta en vez de
 * seguirla. Va en cada petición porque `createApiClient` no tiene opción global.
 */
export const NO_REDIRECT: RequestInit = { redirect: 'error' };

function errorCode(cause: unknown): LinkErrorCode {
    if (cause instanceof ApiError) {
        if (cause.isNetwork) return 'unreachable';
        if (cause.isForbidden) return 'invalidToken';
    }
    return 'generic';
}

/** Comprueba que la dirección es un servidor Navis compatible, antes de enseñarle nada. */
export async function inspectServer(
    rawUrl: string,
    { allowHttp, fetchImpl }: Options,
): Promise<LinkResult<{ url: string; capabilities: SyncCapabilities }>> {
    const normalized = normalizeApiUrl(rawUrl, allowHttp);
    if (!normalized.ok) {
        return {
            ok: false,
            error: normalized.reason === 'insecure' ? 'insecureUrl' : 'invalidUrl',
        };
    }

    try {
        const api = createApiClient({ baseUrl: normalized.url, fetchImpl });
        const payload = await api.get<unknown>('/sync/capabilities', NO_REDIRECT);
        const parsed = syncCapabilitiesSchema.safeParse(payload);
        if (!parsed.success || parsed.data.protocolVersion !== SYNC_PROTOCOL_VERSION) {
            return { ok: false, error: 'incompatible' };
        }
        return { ok: true, value: { url: normalized.url, capabilities: parsed.data } };
    } catch (cause) {
        return { ok: false, error: errorCode(cause) };
    }
}

/** Canjea el token de la web por la credencial propia de este teléfono. */
export async function exchangeToken(
    input: { url: string; token: string; deviceName: string },
    { fetchImpl }: Pick<Options, 'fetchImpl'> = {},
): Promise<LinkResult<DeviceCredential>> {
    try {
        const api = createApiClient({ baseUrl: input.url, fetchImpl });
        const payload = await api.post<unknown>(
            '/device-links/exchange',
            { token: input.token.trim(), deviceName: input.deviceName.trim() },
            NO_REDIRECT,
        );
        const parsed = deviceCredentialSchema.safeParse(payload);
        return parsed.success
            ? { ok: true, value: parsed.data }
            : { ok: false, error: 'incompatible' };
    } catch (cause) {
        return { ok: false, error: errorCode(cause) };
    }
}
