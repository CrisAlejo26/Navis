import { z } from 'zod';

import { MAX_CUSTOM_ROLE_LEVEL } from '../constants';
import { PERMISSIONS } from '../permissions';
import { passwordSchema, emailSchema } from './auth';
import { paginationQuerySchema } from './common';

/**
 * Identificador de un rol. No es una lista cerrada: además de los cuatro de
 * serie, cada instalación puede crear los suyos desde la administración de
 * accesos.
 */
export const roleSlugSchema = z
  .string()
  .trim()
  .min(2)
  .max(40)
  .regex(/^[a-z0-9-]+$/, 'El identificador solo admite minúsculas, números y guiones');

/**
 * Fila del catálogo de roles (tabla `roles`, gestionada por TypeORM).
 *
 * Los roles de serie **no** guardan su nombre: se traduce en la interfaz a
 * partir del slug, para no mantener texto en seis idiomas dentro de la base de
 * datos (Regla 2). Los propios de la instalación sí lo guardan, porque no hay
 * traducción que valga para un nombre que se inventa quien lo crea.
 */
export const roleSchema = z.object({
  id: z.uuid(),
  slug: roleSlugSchema,
  /** Nombre propio. `null` en los de serie, que se traducen. */
  name: z.string().nullable(),
  description: z.string().nullable(),
  /** Posición en la jerarquía: a mayor número, más privilegios. */
  level: z.number().int(),
  /**
   * Qué puede hacer, vista por vista. `['*']` es el comodín del
   * superadministrador. Puede traer permisos de una versión anterior: los que
   * ya no existen en el catálogo no conceden nada (ver `hasPermission`).
   */
  permissions: z.array(z.string()),
  /** Los roles de serie no se pueden borrar ni cambiar de nivel. */
  isSystem: z.boolean(),
  /** Cuántas cuentas lo tienen ahora mismo. */
  usersCount: z.number().int(),
});

export type RoleRow = z.infer<typeof roleSchema>;

/**
 * Los permisos que se le ponen a un rol. Se validan contra el catálogo: un
 * permiso inventado se rechaza en la frontera en vez de guardarse sin efecto.
 * El comodín no se admite aquí: el superadministrador no se fabrica desde la
 * pantalla de roles.
 */
export const rolePermissionsSchema = z.array(z.enum(PERMISSIONS));

/** Alta de un rol propio. El slug lo deriva el servidor a partir del nombre. */
export const createRoleSchema = z.object({
  name: z.string().trim().min(2, 'El nombre es obligatorio').max(60),
  description: z.string().trim().max(200).optional(),
  level: z.coerce.number().int().min(0).max(MAX_CUSTOM_ROLE_LEVEL),
  permissions: rolePermissionsSchema.default([]),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;

/**
 * Edición de un rol. En los de serie no se admiten ni el nombre —se traduce— ni
 * el nivel, que descolocaría la jerarquía; la descripción y los permisos sí.
 */
export const updateRoleSchema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  description: z.string().trim().max(200).nullable().optional(),
  level: z.coerce.number().int().min(0).max(MAX_CUSTOM_ROLE_LEVEL).optional(),
  /** Los permisos sí se cambian en los de serie: es para lo que está la pantalla. */
  permissions: rolePermissionsSchema.optional(),
});

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;

/**
 * El rol de quien pregunta, con sus permisos. Es lo que consultan web y móvil
 * para decidir qué entradas del menú enseñan: la interfaz no puede leerse el
 * catálogo entero solo para saber lo suyo.
 */
export const myRoleSchema = z.object({
  slug: roleSlugSchema,
  permissions: z.array(z.string()),
});

export type MyRole = z.infer<typeof myRoleSchema>;

/** Usuario tal y como lo ve la pantalla de administración de accesos. */
export const managedUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: roleSlugSchema,
  emailVerified: z.boolean(),
  createdAt: z.coerce.date(),
});

export type ManagedUser = z.infer<typeof managedUserSchema>;

export const updateUserRoleSchema = z.object({ role: roleSlugSchema });

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;

/** Alta de una cuenta hecha por un administrador, con su rol desde el minuto uno. */
export const createManagedUserSchema = z.object({
  name: z.string().trim().min(2, 'El nombre es obligatorio').max(120),
  email: emailSchema,
  password: passwordSchema,
  role: roleSlugSchema,
});

export type CreateManagedUserInput = z.infer<typeof createManagedUserSchema>;

/** Edición completa de una cuenta desde la administración de accesos. */
export const updateManagedUserSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  email: emailSchema.optional(),
  role: roleSlugSchema.optional(),
});

export type UpdateManagedUserInput = z.infer<typeof updateManagedUserSchema>;

/** Contraseña puesta por un administrador. Misma política que el alta. */
export const setUserPasswordSchema = z.object({ password: passwordSchema });

export type SetUserPasswordInput = z.infer<typeof setUserPasswordSchema>;

/** Sentido de la ordenación, común a todos los listados. */
export const sortOrderSchema = z.enum(['asc', 'desc']);

export type SortOrder = z.infer<typeof sortOrderSchema>;

export const USER_SORT_FIELDS = ['name', 'email', 'role', 'createdAt'] as const;

export type UserSortField = (typeof USER_SORT_FIELDS)[number];

/** Filtros del listado de usuarios; se serializan tal cual en la query. */
export const managedUsersQuerySchema = paginationQuerySchema.extend({
  /** Busca a la vez en el nombre y en el correo. */
  search: z.string().trim().max(120).optional(),
  role: roleSlugSchema.optional(),
  /**
   * Deja solo las cuentas de esas iglesias. Vacío o ausente, todas las
   * accesibles: el alcance de quien pregunta ya acota por sí solo.
   */
  churchIds: z.array(z.uuid()).optional(),
  sort: z.enum(USER_SORT_FIELDS).default('createdAt'),
  order: sortOrderSchema.default('desc'),
});

export type ManagedUsersQuery = z.infer<typeof managedUsersQuerySchema>;

export const ROLE_SORT_FIELDS = ['slug', 'level', 'usersCount'] as const;

export type RoleSortField = (typeof ROLE_SORT_FIELDS)[number];

export const rolesQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().max(120).optional(),
  sort: z.enum(ROLE_SORT_FIELDS).default('level'),
  order: sortOrderSchema.default('asc'),
});

export type RolesQuery = z.infer<typeof rolesQuerySchema>;

/**
 * Estado de la instalación. `needsSetup` es cierto mientras no exista ninguna
 * cuenta: es lo que hace que la web lleve directamente a crear el
 * administrador en vez de a un login que nadie podría pasar.
 */
export const setupStatusSchema = z.object({ needsSetup: z.boolean() });

export type SetupStatus = z.infer<typeof setupStatusSchema>;
