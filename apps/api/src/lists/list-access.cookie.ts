import { LIST_SESSION_HOURS } from '@navis/shared';
import { createHmac, timingSafeEqual } from 'node:crypto';

import { env, isProduction } from '../config/env';

export const LIST_COOKIE = 'navis.list_access';

/**
 * La cookie de un acceso (RFC 0010 D23).
 *
 * **Dice quién eres, nunca qué puedes ver.** Lleva dentro el identificador del
 * acceso y una caducidad, y nada más: si llevara «puede ver A y B», quitarle el
 * permiso a alguien no tendría efecto hasta que caducara, y una cookie
 * manipulada valdría para lo que dijera ella. La autorización se comprueba **al
 * servir**, contra `list_grants`, en cada petición.
 *
 * De aquí sale gratis la otra mitad de lo que se pidió: **una sola entrada abre
 * todas sus listas**, porque la cookie ya dice quién es.
 *
 * Se firma con una clave derivada de `BETTER_AUTH_SECRET` con etiqueta propia:
 * sin variable de entorno nueva y sin que las dos claves sean la misma. Las dos
 * autenticaciones no comparten nada (D22).
 */
const KEY = createHmac('sha256', env.BETTER_AUTH_SECRET).update('list-access').digest();

interface Payload {
  /** El identificador del acceso. */
  v: string;
  /** Cuándo se emitió: es lo que compara `sessions_valid_from` al revocar (D28). */
  iat: number;
  /** Cuándo deja de valer, en milisegundos desde epoch. */
  exp: number;
}

/** Quién es y desde cuándo. Nada de qué puede ver: eso se consulta al servir. */
export interface ListSession {
  viewerId: string;
  issuedAt: Date;
}

function sign(body: string): string {
  return createHmac('sha256', KEY).update(body).digest('base64url');
}

export function issueListCookie(viewerId: string, now: Date = new Date()): string {
  const payload: Payload = {
    v: viewerId,
    iat: now.getTime(),
    exp: now.getTime() + LIST_SESSION_HOURS * 3_600_000,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');

  return `${body}.${sign(body)}`;
}

/** El acceso que dice la cookie, o `null` si no la hay, no cuadra o caducó. */
export function readListCookie(
  value: string | undefined,
  now: Date = new Date(),
): ListSession | null {
  const [body, firma] = (value ?? '').split('.');
  if (!body || !firma) return null;

  const esperada = Buffer.from(sign(body));
  const recibida = Buffer.from(firma);
  if (esperada.length !== recibida.length || !timingSafeEqual(esperada, recibida)) return null;

  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    return null;
  }

  if (!payload || typeof payload !== 'object') return null;
  const v = 'v' in payload && typeof payload.v === 'string' ? payload.v : null;
  const iat = 'iat' in payload && typeof payload.iat === 'number' ? payload.iat : 0;
  const exp = 'exp' in payload && typeof payload.exp === 'number' ? payload.exp : 0;

  return v && exp > now.getTime() ? { viewerId: v, issuedAt: new Date(iat) } : null;
}

/** La cookie del navegador, sin `cookie-parser`: es la única que se lee aquí. */
export function listCookieFrom(header: string | undefined): string | undefined {
  return header
    ?.split(';')
    .map((one) => one.trim())
    .find((one) => one.startsWith(`${LIST_COOKIE}=`))
    ?.slice(LIST_COOKIE.length + 1);
}

export const LIST_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  path: '/',
  maxAge: LIST_SESSION_HOURS * 3_600_000,
} as const;
