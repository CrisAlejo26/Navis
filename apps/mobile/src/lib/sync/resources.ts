/**
 * Cuándo conviene no sincronizar por falta de recursos del teléfono. Son
 * umbrales de producto, no de seguridad: nada se pierde al esperar, el trabajo
 * sigue en la cola de SQLite.
 */

/** Espacio libre mínimo para aplicar una descarga: 50 MB. Por debajo, se sube pero no se baja. */
export const MIN_FREE_BYTES = 50 * 1024 * 1024;

/** Con menos de este nivel de batería (y sin cargar), las vueltas automáticas esperan. */
export const LOW_BATTERY_LEVEL = 0.15;

export const hasRoomToDownload = (freeBytes: number): boolean => freeBytes >= MIN_FREE_BYTES;

/**
 * Una vuelta **automática** se aplaza con batería baja sin cargador; la que pide
 * la persona con el botón no: ella decide. Un nivel desconocido (`-1`) no frena.
 */
export function shouldDeferForBattery(level: number, charging: boolean, manual: boolean): boolean {
    if (manual || charging || level < 0) return false;
    return level < LOW_BATTERY_LEVEL;
}
