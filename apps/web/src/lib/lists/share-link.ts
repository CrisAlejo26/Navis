import { listShareUrl } from '@navis/shared';

/**
 * El enlace que se reparte.
 *
 * Se arma sobre **el origen de la web** y no sobre el de la API: en producción
 * nginx manda `/l/` al contenedor de la API bajo el mismo dominio (RFC 0010
 * D14, §11), así que el enlace que se copia es el del sitio.
 *
 * En desarrollo la web vive en otro puerto que la API, así que ahí se usa el de
 * la API: es el único sitio donde `/l/` contesta.
 */
export function shareLinkFor(token: string, apiBaseUrl: string): string {
  return listShareUrl(originOf(apiBaseUrl), token);
}

/**
 * El origen desde el que se sirven `/l/<token>/...`: la portada y las fotos.
 *
 * Es el mismo que el del enlace, y por el mismo motivo: en producción nginx lo
 * manda a la API bajo el dominio del sitio, y en desarrollo solo contesta la API.
 */
export function publicAssetOrigin(apiBaseUrl: string): string {
  return originOf(apiBaseUrl);
}

function originOf(apiBaseUrl: string): string {
  const web = globalThis.location.origin;

  try {
    const api = new URL(apiBaseUrl).origin;
    return api === web ? web : api;
  } catch {
    return web;
  }
}

/** Copiar al portapapeles, diciendo si se pudo: sin conexión segura, no se puede. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
