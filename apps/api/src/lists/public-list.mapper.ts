/**
 * **La lista blanca cerrada** de lo que sale a la calle (RFC 0010 D16).
 *
 * La función vive en `@navis/shared` porque la usan los dos lados: el servidor
 * para servir el JSON y el navegador para componer la lámina que se sube como
 * portada (D18). Dos copias serían dos ideas distintas de qué es público, y la
 * que se quedara atrás publicaría de más.
 *
 * Se reexporta desde aquí para que el módulo siga teniendo su mapeador donde lo
 * busca quien lea el RFC.
 */
export { toPublicListMember as toPublicMember } from '@navis/shared';
