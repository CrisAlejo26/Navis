/**
 * La estela ahora vive en `@navis/shared` (RFC 0001: el panel de inicio la
 * dibuja también en móvil). Este fichero queda como reexportación para no
 * tocar los cuatro sitios que ya la importan de aquí.
 */
export { WAKE_MIN_DAYS, wakeShape, type WakeShape } from '@navis/shared';
