import { useRoles } from '@navis/api-client';
import { ROLES, isSystemRole, type Role, type RoleRow, type RoleSlug } from '@navis/shared';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { api } from './api';

/**
 * El rol que trae la sesión de Better Auth es un campo extra declarado como
 * texto, así que llega tipado como `string`. Se valida aquí contra el catálogo
 * de serie en vez de forzar el tipo con un `as` (Regla 10).
 */
export function toRole(value: string | undefined | null): Role | undefined {
  return ROLES.find((role) => role === value);
}

/**
 * Nombre y descripción de los roles **de serie**, como claves de traducción.
 *
 * Es un mapa explícito y no una plantilla del tipo `t(\`roles.${slug}\`)`
 * porque las claves construidas al vuelo se saltan el tipado de i18next y
 * dejan de avisar cuando falta una traducción (Regla 2). Los roles propios de
 * cada instalación no están aquí: guardan su nombre en la base de datos.
 */
export const ROLE_LABEL_KEY = {
  member: 'roles.member',
  leader: 'roles.leader',
  pastor: 'roles.pastor',
  admin: 'roles.admin',
} as const satisfies Record<Role, string>;

export const ROLE_HINT_KEY = {
  member: 'roles.memberHint',
  leader: 'roles.leaderHint',
  pastor: 'roles.pastorHint',
  admin: 'roles.adminHint',
} as const satisfies Record<Role, string>;

/**
 * El nombre visible de un rol: traducido si es de serie, y el que le pusieron
 * si es propio de la instalación (esos no tienen traducción posible).
 */
export function useRoleLabel(): (role: { slug: RoleSlug; name?: string | null }) => string {
  const { t } = useTranslation();

  return (role) =>
    isSystemRole(role.slug) ? t(ROLE_LABEL_KEY[role.slug]) : (role.name ?? role.slug);
}

/**
 * El catálogo completo indexado por slug, para poner nombre y nivel al rol de
 * cada cuenta. Son pocas filas y se cachean durante minutos, así que sale más
 * barato que devolver el rol entero en cada usuario del listado.
 */
export function useRoleCatalog(enabled = true): Map<RoleSlug, RoleRow> {
  const { data } = useRoles(api, { page: 1, limit: 100, sort: 'level', order: 'asc' }, enabled);

  return useMemo(
    () => new Map((data?.items ?? []).map((role) => [role.slug, role])),
    [data?.items],
  );
}
