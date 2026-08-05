import { createHash, randomBytes } from 'node:crypto';

/**
 * Quién ha abierto la página, **sin guardar la dirección IP entera** (RFC 0010
 * D32).
 *
 * La razón no es solo legal: la IP completa no contesta ninguna pregunta que el
 * prefijo y el hash no contesten ya. Y en las listas restringidas hay algo mejor
 * que una IP, que es el nombre de quien entró (D35).
 */

/**
 * La sal del día, en memoria. Rota a medianoche y **no se guarda en ninguna
 * parte**: en cuanto cambia, el hash de ayer deja de servir para identificar a
 * nadie y sigue sirviendo para contar personas distintas dentro de su día.
 */
let sal = randomBytes(32);
let salDe = '';

function saltOf(day: string): Buffer {
  if (day !== salDe) {
    sal = randomBytes(32);
    salDe = day;
  }
  return sal;
}

export function visitorHash(day: string, ip: string, userAgent: string): string {
  return createHash('sha256')
    .update(saltOf(day))
    .update(ip)
    .update(userAgent)
    .digest('hex')
    .slice(0, 32);
}

/**
 * El /24 en IPv4 y el /48 en IPv6: `81.34.12.0`, `2a02:9000::`. Dice el
 * operador y la zona aproximada, que es lo que de verdad se mira.
 */
export function ipPrefix(ip: string): string {
  const limpia = ip.replace(/^::ffff:/i, '');

  if (limpia.includes('.')) {
    const partes = limpia.split('.');
    return partes.length === 4 ? `${partes[0] ?? ''}.${partes[1] ?? ''}.${partes[2] ?? ''}.0` : '';
  }

  if (!limpia.includes(':')) return '';

  return `${limpia.split(':').slice(0, 3).join(':')}::`;
}

export type Device = 'mobile' | 'tablet' | 'desktop';

/** Lo poco que se saca del user-agent: aparato y sistema, nada más. */
export function deviceOf(userAgent: string): Device {
  if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/i.test(userAgent)) return 'tablet';
  if (/mobi|iphone|ipod|android|blackberry|windows phone/i.test(userAgent)) return 'mobile';
  return 'desktop';
}

export function platformOf(userAgent: string): string | null {
  if (/android/i.test(userAgent)) return 'Android';
  if (/iphone|ipad|ipod|ios/i.test(userAgent)) return 'iOS';
  if (/mac os x|macintosh/i.test(userAgent)) return 'macOS';
  if (/windows/i.test(userAgent)) return 'Windows';
  if (/linux|x11/i.test(userAgent)) return 'Linux';
  return null;
}

/** De dónde llega: `wa.me`, `t.co`… Nulo es «directo». */
export function referrerHost(referrer: string | undefined): string | null {
  if (!referrer) return null;

  try {
    return new URL(referrer).hostname || null;
  } catch {
    return null;
  }
}
