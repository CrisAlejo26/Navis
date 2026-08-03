/**
 * Qué se puede hacer en Navis, vista por vista.
 *
 * Sustituye a la jerarquía por niveles como criterio de acceso: los papeles de
 * una iglesia no se ordenan en línea recta —quien lleva el sonido no está «por
 * encima» ni «por debajo» de quien atiende recepción—, así que lo que decide es
 * la lista de permisos de su rol y no un número.
 *
 * El formato es `modulo.accion`: `view` es entrar y leer, `manage` es crear,
 * editar y borrar. Cada rol guarda los suyos en la tabla `roles`.
 */
export const PERMISSIONS = [
  'dashboard.view',
  'calendar.view',
  'calendar.manage',
  'believers.view',
  'believers.manage',
  'communications.view',
  'communications.manage',
  'prophecies.view',
  'prophecies.manage',
  'dreams.view',
  'dreams.manage',
  'users.view',
  'users.manage',
  'roles.manage',
  'churches.view',
  'churches.manage',
  'ai.use',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

/**
 * El comodín del superadministrador. Se comprueba en `hasPermission` y en
 * ningún sitio más: un «si es superadmin, pasa» repartido por el código es la
 * forma segura de olvidarse de ponerlo en algún guard.
 */
export const ALL_PERMISSIONS = '*';

export function isPermission(value: string): value is Permission {
  return (PERMISSIONS as readonly string[]).includes(value);
}

/** Los módulos, en el orden en que se agrupan en la pantalla de roles. */
export const PERMISSION_MODULES = [
  'dashboard',
  'calendar',
  'believers',
  'communications',
  'prophecies',
  'dreams',
  'users',
  'roles',
  'churches',
  'ai',
] as const;

export type PermissionModule = (typeof PERMISSION_MODULES)[number];

/** Los permisos de un módulo, para pintarlos juntos. */
export function permissionsOfModule(module: PermissionModule): Permission[] {
  return PERMISSIONS.filter((permission) => permission.startsWith(`${module}.`));
}

/**
 * Si una lista de permisos concedidos cubre el que se exige.
 *
 * La lista llega como `string[]` y no como `Permission[]` a propósito: viene de
 * la base de datos, donde puede haber quedado un permiso de una versión
 * anterior. Uno que ya no existe no casa con nada y por tanto no concede nada.
 */
export function hasPermission(granted: readonly string[], required: Permission): boolean {
  return granted.includes(ALL_PERMISSIONS) || granted.includes(required);
}

/** Si los cubre todos. Es lo que exige un endpoint con varios permisos. */
export function hasEveryPermission(
  granted: readonly string[],
  required: readonly Permission[],
): boolean {
  return required.every((permission) => hasPermission(granted, permission));
}
