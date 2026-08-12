import type { Role } from './constants';
import { ALL_PERMISSIONS, type Permission } from './permissions';

/**
 * Con qué permisos nace cada rol de serie. Es la **semilla**, no la ley: el
 * superadministrador reajusta cualquiera de ellos desde la administración de
 * accesos, y los cuatro ministerios son los que más van a cambiar de una
 * iglesia a otra.
 *
 * Lo que decide qué puede hacer alguien es siempre la fila de la tabla `roles`;
 * esto solo dice cómo se rellena la primera vez (ver la migración
 * `SeedMinistryRoles`).
 */
export const ROLE_PERMISSIONS: Record<Role, readonly string[]> = {
  /** Lo ve todo, en todas las iglesias, y es el único que reparte permisos. */
  superadmin: [ALL_PERMISSIONS],

  /**
   * Todo lo suyo: sus iglesias, sus creyentes y las cuentas que ha creado. Lo
   * que no toca es el catálogo de roles, que es la llave del resto de llaves.
   */
  pastor: [
    'dashboard.view',
    'tasks.view',
    'calendar.view',
    'calendar.manage',
    'believers.view',
    'believers.manage',
    'journal.view',
    'journal.manage',
    'lists.view',
    'lists.manage',
    'lists.share',
    'communications.view',
    'communications.manage',
    'users.view',
    'users.manage',
    'churches.view',
    'churches.manage',
    'ai.use',
  ] satisfies Permission[],

  /** Lleva las personas y la agenda: es quien está en la puerta. */
  recepcion: [
    'dashboard.view',
    'tasks.view',
    'calendar.view',
    'calendar.manage',
    'believers.view',
    'believers.manage',
    'lists.view',
    'lists.manage',
    'communications.view',
    'churches.view',
  ] satisfies Permission[],

  /** Consulta para preparar: ve a las personas, no las cambia. */
  biblias: [
    'dashboard.view',
    'tasks.view',
    'calendar.view',
    'believers.view',
    'lists.view',
    'communications.view',
    'churches.view',
  ] satisfies Permission[],

  /** Necesita saber qué hay programado, y poco más. */
  sonido: [
    'dashboard.view',
    'tasks.view',
    'calendar.view',
    'lists.view',
    'communications.view',
    'churches.view',
  ] satisfies Permission[],

  /** Habla desde el frente, así que publica los avisos. */
  pulpito: [
    'dashboard.view',
    'tasks.view',
    'calendar.view',
    'lists.view',
    'communications.view',
    'communications.manage',
    'churches.view',
  ] satisfies Permission[],

  /**
   * El día a día del pastor —calendario, creyentes, listas, comunicaciones—
   * sin la parte que lo hace pastor: no administra usuarios y no lleva
   * `churches.manage`, así que nunca crea ni entra en más de una iglesia
   * (RFC 0014).
   */
  'predicador-apoyo': [
    'dashboard.view',
    'tasks.view',
    'calendar.view',
    'calendar.manage',
    'believers.view',
    'believers.manage',
    'journal.view',
    'journal.manage',
    'lists.view',
    'lists.manage',
    'lists.share',
    'communications.view',
    'communications.manage',
    'churches.view',
  ] satisfies Permission[],

  /**
   * Sin acceso al panel. Su cuenta existe para quedar enlazada a su ficha de
   * creyente; sus ajustes y su perfil no llevan permiso, los tiene cualquiera
   * con sesión.
   */
  creyente: [],
};
