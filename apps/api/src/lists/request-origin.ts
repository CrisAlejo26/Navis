import type { Request } from 'express';

import { env } from '../config/env';

/**
 * El origen desde el que se está sirviendo esta petición.
 *
 * Se usa para las `og:` y para la URL de la portada, y se toma **de la propia
 * petición** a propósito: el rastreador ha resuelto este host y lo que tiene que
 * leer en la tarjeta es ese mismo, no otro configurado en un fichero. Una
 * cabecera `Host` inventada solo afecta a la respuesta que recibe quien la
 * inventó.
 *
 * El protocolo sale de `X-Forwarded-Proto` **solo con `TRUST_PROXY`**: sin proxy
 * delante, esa cabecera la escribe cualquiera.
 */
export function originOf(request: Request): string {
  const host = request.get('host') ?? `localhost:${String(env.API_PORT)}`;
  const forwarded = env.TRUST_PROXY ? request.get('x-forwarded-proto') : undefined;
  const protocol = (forwarded ?? request.protocol).split(',')[0]?.trim() || 'http';

  return `${protocol}://${host}`;
}
