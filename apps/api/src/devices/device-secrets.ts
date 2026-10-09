import { createHash, randomBytes } from 'node:crypto';

/** Prefijo de las credenciales de dispositivo: el guard las distingue de una sesión a simple vista. */
export const DEVICE_CREDENTIAL_PREFIX = 'nvd_';
const LINK_TOKEN_PREFIX = 'nvl_';

/** Huella con la que se guarda y se busca cualquier secreto; el valor en claro nunca se persiste. */
export function hashSecret(secret: string): string {
    return createHash('sha256').update(secret).digest('hex');
}

function randomSecret(prefix: string): string {
    return prefix + randomBytes(32).toString('base64url');
}

export const newLinkToken = (): string => randomSecret(LINK_TOKEN_PREFIX);
export const newDeviceCredential = (): string => randomSecret(DEVICE_CREDENTIAL_PREFIX);

/** Extrae la credencial de `Authorization: Bearer nvd_…`, o `null` si no es de un dispositivo. */
export function deviceCredentialFrom(header: string | undefined): string | null {
    const match = /^Bearer (nvd_[A-Za-z0-9_-]{20,100})$/.exec(header ?? '');
    return match?.[1] ?? null;
}
