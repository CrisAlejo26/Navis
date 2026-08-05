import { z } from 'zod';

/**
 * La contraseña de un acceso, generada para que alguien la lea en voz alta y
 * otro la teclee con el pulgar (RFC 0010 D25).
 *
 * El alfabeto deja fuera lo que se confunde al dictarlo: `0 O o`, `1 l I`,
 * `5 S` y `2 Z`. Quedan 27 caracteres, todos en minúscula.
 */
export const LIST_PASSWORD_ALPHABET = 'abcdefghjkmnpqrtuvwxy346789';

/** Doce caracteres en tres grupos de cuatro: `k7fr-m3np-t9wx`. */
export const LIST_PASSWORD_GROUPS = 3;
export const LIST_PASSWORD_GROUP_SIZE = 4;

/** Mínimo de quien prefiera escribirla a mano, ya sin guiones. */
export const LIST_PASSWORD_MIN_LENGTH = 8;

/**
 * Los guiones **no cuentan al comprobarla**: quien la escriba de corrido entra
 * igual. La normalización vive aquí y la usan los dos lados —la web la genera,
 * la API la valida—, porque si divergieran una contraseña buena dejaría de
 * valer.
 *
 * No se cambia de caja a propósito: quien escriba la suya con mayúsculas
 * espera que cuenten.
 */
export function normalizeListPassword(value: string): string {
  return value.replace(/[\s-]+/g, '');
}

/**
 * Un carácter al azar del alfabeto, **sin sesgo**: `% longitud` sobre un byte
 * favorecería a los primeros cinco caracteres, que es justo lo que un atacante
 * probaría primero.
 */
function pick(): string {
  const limit = 256 - (256 % LIST_PASSWORD_ALPHABET.length);
  const buffer = new Uint8Array(1);

  for (;;) {
    globalThis.crypto.getRandomValues(buffer);
    const byte = buffer[0] ?? 0;
    if (byte < limit) return LIST_PASSWORD_ALPHABET[byte % LIST_PASSWORD_ALPHABET.length] ?? 'a';
  }
}

/**
 * Una contraseña nueva, con sus guiones puestos. De `crypto.getRandomValues`,
 * nunca de `Math.random`.
 */
export function generateListPassword(): string {
  return Array.from({ length: LIST_PASSWORD_GROUPS }, () =>
    Array.from({ length: LIST_PASSWORD_GROUP_SIZE }, pick).join(''),
  ).join('-');
}

/** Se mide **normalizada**: `abcd-efgh` son ocho caracteres, no nueve. */
export const listPasswordSchema = z
  .string()
  .max(200)
  .refine(
    (value) => normalizeListPassword(value).length >= LIST_PASSWORD_MIN_LENGTH,
    `La contraseña necesita al menos ${String(LIST_PASSWORD_MIN_LENGTH)} caracteres`,
  );
