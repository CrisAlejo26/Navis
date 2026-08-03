import { useRoles } from '@navis/api-client';
import { isSystemRole, type Role, type RoleRow, type RoleSlug } from '@navis/shared';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { api } from './api';

/**
 * Nombre y descripción de los roles **de serie**, como claves de traducción.
 *
 * Es un mapa explícito y no una plantilla del tipo `t(\`roles.${slug}\`)`
 * porque las claves construidas al vuelo se saltan el tipado de i18next y
 * dejan de avisar cuando falta una traducción (Regla 2). Los roles propios de
 * cada instalación no están aquí: guardan su nombre en la base de datos.
 */
export const ROLE_LABEL_KEY = {
  creyente: 'roles.creyente',
  recepcion: 'roles.recepcion',
  biblias: 'roles.biblias',
  sonido: 'roles.sonido',
  pulpito: 'roles.pulpito',
  pastor: 'roles.pastor',
  superadmin: 'roles.superadmin',
} as const satisfies Record<Role, string>;

export const ROLE_HINT_KEY = {
  creyente: 'roles.creyenteHint',
  recepcion: 'roles.recepcionHint',
  biblias: 'roles.bibliasHint',
  sonido: 'roles.sonidoHint',
  pulpito: 'roles.pulpitoHint',
  pastor: 'roles.pastorHint',
  superadmin: 'roles.superadminHint',
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
 * Qué explica un rol: la traducción de su descripción si es de serie, y lo que
 * escribió quien lo creó si es propio.
 */
export function useRoleHint(): (role: {
  slug: RoleSlug;
  description?: string | null;
}) => string | null {
  const { t } = useTranslation();

  return (role) =>
    isSystemRole(role.slug) ? t(ROLE_HINT_KEY[role.slug]) : (role.description ?? null);
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
