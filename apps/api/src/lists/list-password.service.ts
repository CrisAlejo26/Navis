import { Injectable } from '@nestjs/common';
import { normalizeListPassword } from '@navis/shared';
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const derive = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number },
) => Promise<Buffer>;

/**
 * `2^14` y no `2^15` a propósito (RFC 0010 D24): son unos 50 ms, el bucle de
 * eventos de Node reparte `scrypt` en un pool de **cuatro** hilos por defecto, y
 * esto cuelga de un endpoint público. Con `2^15` bastarían diez intentos
 * simultáneos para dejar la API sorda un segundo.
 */
const N = 2 ** 14;
const R = 8;
const P = 1;
const KEY_BYTES = 32;
const SALT_BYTES = 16;

/**
 * La contraseña de un acceso, con `scrypt` de la biblioteca estándar: sin
 * dependencia nueva y sin compilar nada.
 *
 * Se guarda `scrypt$N$r$p$sal$clave`, **con los parámetros dentro**, para poder
 * subirlos dentro de unos años sin invalidar lo que ya hay. Siempre la versión
 * **asíncrona**, nunca `scryptSync`.
 */
@Injectable()
export class ListPasswordService {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(SALT_BYTES);
    const key = await derive(normalizeListPassword(password), salt, KEY_BYTES, { N, r: R, p: P });

    return ['scrypt', N, R, P, salt.toString('base64'), key.toString('base64')].join('$');
  }

  /**
   * Comparación en **tiempo constante**, y cuando el usuario no existe se
   * compara igual contra un hash de mentira: tardar menos delataría que ese
   * usuario no está, y el formulario se convertiría en una máquina de averiguar
   * quién tiene llave.
   */
  async verify(password: string, stored: string | null): Promise<boolean> {
    const parsed = parse(stored ?? (await falso()));
    if (!parsed) return false;

    const key = await derive(normalizeListPassword(password), parsed.salt, parsed.key.length, {
      N: parsed.N,
      r: parsed.r,
      p: parsed.p,
    });

    // La comparación se hace igual con el señuelo y el resultado se descarta
    // después: salirse antes volvería a delatar al usuario que no existe.
    const igual = timingSafeEqual(key, parsed.key);

    return stored !== null && igual;
  }
}

interface Parsed {
  N: number;
  r: number;
  p: number;
  salt: Buffer;
  key: Buffer;
}

function parse(stored: string): Parsed | null {
  const [algorithm, n, r, p, salt, key] = stored.split('$');
  if (algorithm !== 'scrypt' || !n || !r || !p || !salt || !key) return null;

  const parsed = {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    salt: Buffer.from(salt, 'base64'),
    key: Buffer.from(key, 'base64'),
  };

  return Number.isFinite(parsed.N) && parsed.key.length > 0 ? parsed : null;
}

/** El señuelo, calculado una sola vez: su coste es el mismo que el de verdad. */
let señuelo: Promise<string> | null = null;

function falso(): Promise<string> {
  señuelo ??= new ListPasswordService().hash('no-existe-este-acceso');
  return señuelo;
}
