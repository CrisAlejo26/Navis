import { z } from 'zod';

/**
 * El enlace de una lista publicada (RFC 0010 D10).
 *
 * **El token es un secreto, no un nombre**: 16 bytes al azar en base64url, 22
 * caracteres. Nada de `/l/iglesia-el-faro/pulpito`, porque un enlace adivinable
 * no es un enlace privado y aquí hay nombres de personas detrás.
 */
export const LIST_TOKEN_BYTES = 16;
export const LIST_TOKEN_LENGTH = 22;

const TOKEN = /^[A-Za-z0-9_-]{22}$/;

export function isListShareToken(value: string): boolean {
  return TOKEN.test(value);
}

export const listShareTokenSchema = z
  .string()
  .refine(isListShareToken, 'El enlace no tiene la forma de un enlace de lista');

/** base64url sin relleno: lo que cabe en una URL sin escaparse. */
function toBase64Url(bytes: Uint8Array): string {
  let binario = '';
  for (const byte of bytes) binario += String.fromCharCode(byte);

  return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function generateListShareToken(): string {
  const bytes = new Uint8Array(LIST_TOKEN_BYTES);
  globalThis.crypto.getRandomValues(bytes);

  return toBase64Url(bytes);
}

/**
 * La ruta del documento que sirve **la API** (D14), no la SPA.
 *
 * Es la que se reparte: los rastreadores de WhatsApp o Telegram no ejecutan
 * JavaScript, así que las etiquetas `og:` las tiene que poner el servidor.
 */
export function listSharePath(token: string): string {
  return `/l/${token}`;
}

/**
 * La foto de un miembro, con sus cinco cierres detrás (D17).
 *
 * Cuelga del token y no de `/believer-photos/:id`: aquella ruta va con
 * `ActiveChurchGuard` y desde la calle devuelve 401.
 */
export function listPhotoPath(token: string, believerId: string): string {
  return `${listSharePath(token)}/photos/${believerId}`;
}

/** La portada de la tarjeta, para la vista previa de WhatsApp (D18). */
export function listCardPath(token: string): string {
  return `${listSharePath(token)}/card.png`;
}

/** La ruta bonita de la SPA, a la que redirige el documento anterior. */
export function listPublicPath(token: string): string {
  return `/lists/s/${token}`;
}

export function listShareUrl(origin: string, token: string): string {
  return `${origin.replace(/\/+$/, '')}${listSharePath(token)}`;
}
