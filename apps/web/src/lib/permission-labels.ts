import type { PermissionModule } from '@navis/shared';

/**
 * El nombre de cada módulo, como clave de traducción.
 *
 * Mapa explícito y no ``t(`permissions.${modulo}`)``: una clave construida al
 * vuelo se salta el tipado de i18next y deja de avisar cuando falta una
 * traducción (Regla 2).
 *
 * Se traduce el módulo y la acción (`ver` / `gestionar`) por separado, no los
 * diecisiete permisos uno a uno: es el mismo par de palabras repetido, y así la
 * pantalla se lee como una tabla en vez de como una lista de identificadores.
 */
export const MODULE_LABEL_KEY = {
  dashboard: 'nav.dashboard',
  calendar: 'nav.calendar',
  believers: 'nav.believers',
  communications: 'nav.communications',
  // Ni las profecías ni los sueños salen aquí: no tienen permiso de rol
  // (RFC 0004 D2 y RFC 0005 D2).
  users: 'nav.users',
  roles: 'permissions.roles',
  churches: 'permissions.churches',
  ai: 'permissions.ai',
} as const satisfies Record<PermissionModule, string>;
