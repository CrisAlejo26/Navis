import { permissionsOfModule, type Permission, type PermissionModule } from './permissions';

/**
 * El nombre de cada módulo de permisos, como clave de traducción.
 *
 * Mapa explícito y no ``t(`permissions.${modulo}`)``: una clave construida al
 * vuelo se salta el tipado de i18next y deja de avisar cuando falta una
 * traducción (Regla 2).
 *
 * Se traduce el módulo y la acción (`ver` / `gestionar` / `publicar`) por
 * separado, no los diecisiete permisos uno a uno: es el mismo par de palabras
 * repetido, y así la pantalla se lee como una tabla en vez de como una lista de
 * identificadores. Lo comparten la web y el móvil; el texto está en
 * `packages/i18n`.
 */
export const MODULE_LABEL_KEY = {
    dashboard: 'nav.dashboard',
    calendar: 'nav.calendar',
    believers: 'nav.believers',
    journal: 'nav.journal',
    tasks: 'nav.tasks',
    lists: 'nav.lists',
    tables: 'nav.tables',
    communications: 'nav.communications',
    // Ni las profecías ni los sueños salen aquí: no tienen permiso de rol
    // (RFC 0004 D2 y RFC 0005 D2).
    users: 'nav.users',
    roles: 'permissions.roles',
    churches: 'permissions.churches',
    ai: 'permissions.ai',
} as const satisfies Record<PermissionModule, string>;

/** La acción que hay detrás de cada permiso, para poner cada casilla en su columna. */
export const PERMISSION_ACTION_LABEL_KEY = {
    view: 'permissions.view',
    manage: 'permissions.manage',
    // Publicar una lista es una acción aparte de editarla (RFC 0010 D8), así que
    // tiene su propia casilla y no se esconde dentro de «gestionar».
    share: 'permissions.share',
} as const;

export type PermissionAction = keyof typeof PERMISSION_ACTION_LABEL_KEY;

export function permissionAction(permission: Permission): PermissionAction {
    if (permission.endsWith('.share')) return 'share';
    return permission.endsWith('.manage') ? 'manage' : 'view';
}

/**
 * Los módulos de los que un rol tiene algo, con lo que tiene de cada uno. Es lo
 * que enseña la ficha de un rol: leer una fila responde «¿qué ve recepción?».
 * `['*']` (el superadministrador) no entra aquí: lo trata quien pinta.
 */
export function grantedByModule(
    granted: readonly string[],
    modules: readonly PermissionModule[],
): { module: PermissionModule; permissions: Permission[] }[] {
    return modules
        .map((module) => ({
            module,
            permissions: permissionsOfModule(module).filter((permission) =>
                granted.includes(permission),
            ),
        }))
        .filter((row) => row.permissions.length > 0);
}
