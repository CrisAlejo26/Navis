/**
 * El freno de la puerta (RFC 0010 D27).
 *
 * **Se frena el origen, no la cuenta.** Bloquear un acceso tras cinco fallos
 * suena prudente y es un regalo: cualquiera con el enlace podría dejar fuera a
 * los ancianos fallando cinco veces a propósito. Lo que se frena es de dónde
 * vienen los intentos, así que un acceso legítimo sigue funcionando desde otro
 * sitio.
 *
 * En memoria y por proceso: es un freno, no un registro —eso es
 * `list_access_log`—, y una API reiniciada que perdona diez intentos no es un
 * problema. Depende de que la IP sea la de verdad (D32, §11).
 */
export const LIST_TRIES = 10;
export const LIST_WINDOW_MS = 15 * 60_000;

/** A partir del tercer fallo, un retardo pequeño y creciente, con su tope. */
const DELAY_FROM = 3;
const DELAY_STEP_MS = 250;
const DELAY_MAX_MS = 2_000;

interface Bucket {
  fails: number;
  tries: number;
  until: number;
}

const buckets = new Map<string, Bucket>();

function bucketOf(key: string, now: number): Bucket {
  const found = buckets.get(key);
  if (found && found.until > now) return found;

  const fresh: Bucket = { fails: 0, tries: 0, until: now + LIST_WINDOW_MS };
  buckets.set(key, fresh);

  // La tabla se limpia sola al usarla: sin esto, un proceso largo acumularía un
  // cubo por cada prefijo que haya llamado alguna vez.
  if (buckets.size > 5_000) {
    for (const [otra, cubo] of buckets) if (cubo.until <= now) buckets.delete(otra);
  }

  return fresh;
}

/** Cuántos milisegundos faltan, o 0 si puede intentarlo. */
export function retryAfterMs(key: string, now = Date.now()): number {
  const bucket = bucketOf(key, now);
  return bucket.tries >= LIST_TRIES ? bucket.until - now : 0;
}

/** Apunta el intento y devuelve el retardo que toca aplicar antes de contestar. */
export function noteTry(key: string, ok: boolean, now = Date.now()): number {
  const bucket = bucketOf(key, now);
  bucket.tries += 1;

  if (ok) {
    bucket.fails = 0;
    return 0;
  }

  bucket.fails += 1;
  if (bucket.fails < DELAY_FROM) return 0;

  return Math.min((bucket.fails - DELAY_FROM + 1) * DELAY_STEP_MS, DELAY_MAX_MS);
}

/** Solo para los tests: el freno es de proceso y no se reinicia solo. */
export function resetListThrottle(): void {
  buckets.clear();
}
