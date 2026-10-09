export type ApiUrlResult =
    { ok: true; url: string } | { ok: false; reason: 'invalid' | 'insecure' };

/**
 * Normaliza lo que alguien pega como dirección del servidor: sin espacios, sin
 * barras finales, sin credenciales ni parámetros. `http` solo se admite cuando
 * se pide expresamente (desarrollo), porque el token y la credencial viajarían
 * en claro.
 */
export function normalizeApiUrl(input: string, allowHttp: boolean): ApiUrlResult {
    let parsed: URL;
    try {
        parsed = new URL(input.trim());
    } catch {
        return { ok: false, reason: 'invalid' };
    }
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        return { ok: false, reason: 'invalid' };
    }
    if (parsed.username || parsed.password || parsed.search || parsed.hash) {
        return { ok: false, reason: 'invalid' };
    }
    if (parsed.protocol === 'http:' && !allowHttp) return { ok: false, reason: 'insecure' };
    return { ok: true, url: `${parsed.origin}${parsed.pathname}`.replace(/\/+$/, '') };
}
