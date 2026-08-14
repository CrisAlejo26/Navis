import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from 'node:crypto';

import { env } from '../config/env';

/**
 * Cifrado de una celda de tipo contraseña (RFC 0021 D20–D21).
 *
 * No es un hash: quien la escribe necesita volver a leerla —«la contraseña
 * del router del salón»—, y un hash de un solo sentido no sirve para eso. Se
 * cifra con AES-256-GCM y una clave derivada por HKDF de `BETTER_AUTH_SECRET`
 * con una etiqueta propia, el mismo patrón de «una etiqueta, sin variable de
 * entorno nueva» que ya usa la cookie de acceso a listas (RFC 0010 D23) — solo
 * que aquélla firma y esta cifra de verdad.
 */
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

const KEY = Buffer.from(hkdfSync('sha256', env.BETTER_AUTH_SECRET, '', 'table-field-secret', 32));

/** `iv.tag.ciphertext`, cada parte en base64url: es lo que se guarda en el JSON de la fila. */
export function encryptTableField(plain: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [iv, tag, ciphertext].map((part) => part.toString('base64url')).join('.');
}

/** El texto claro de un valor cifrado con `encryptTableField`. */
export function decryptTableField(value: string): string {
  const [ivPart, tagPart, ciphertextPart] = value.split('.');
  if (!ivPart || !tagPart || !ciphertextPart) {
    throw new Error('Valor cifrado de tabla con formato inválido');
  }

  const decipher = createDecipheriv(ALGORITHM, KEY, Buffer.from(ivPart, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagPart, 'base64url'));

  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextPart, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}

/** Si un valor ya está cifrado (tres partes en base64url), y no texto claro sin tocar. */
export function isEncryptedTableField(value: unknown): value is string {
  return typeof value === 'string' && value.split('.').length === 3;
}
