import { useRoles } from '@navis/api-client';
import {
  ACCENT_PALETTE,
  DEFAULT_ROLE,
  isSystemRole,
  SUPERADMIN_ROLE,
  type Role,
  type RoleRow,
  type RoleSlug,
} from '@navis/shared';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { api } from './api';
import { useSession } from './auth-client';

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
  'coordinador-ofrenda': 'roles.coordinadorOfrenda',
  'predicador-apoyo': 'roles.predicadorApoyo',
  pastor: 'roles.pastor',
  superadmin: 'roles.superadmin',
} as const satisfies Record<Role, string>;

export const ROLE_HINT_KEY = {
  creyente: 'roles.creyenteHint',
  recepcion: 'roles.recepcionHint',
  biblias: 'roles.bibliasHint',
  sonido: 'roles.sonidoHint',
  pulpito: 'roles.pulpitoHint',
  'coordinador-ofrenda': 'roles.coordinadorOfrendaHint',
  'predicador-apoyo': 'roles.predicadorApoyoHint',
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

/**
 * El color de un rol, por su nivel en la jerarquía.
 *
 * No es un campo nuevo en la base de datos: se deriva del `level` que ya
 * tiene cada rol, con la misma paleta ampliada que ya distingue sedes, dones
 * y tipos de anotación (`ACCENT_PALETTE`). Dos roles del mismo nivel
 * comparten color a propósito —los cuatro ministerios, por ejemplo—: el color
 * dice **el escalón**, no el rol exacto, que ya lo dice el nombre al lado
 * (Regla 9 §3: el color nunca informa solo).
 */
export function roleAccent(level: number): string {
  const index = ((level % ACCENT_PALETTE.length) + ACCENT_PALETTE.length) % ACCENT_PALETTE.length;
  return ACCENT_PALETTE[index];
}

/**
 * El tope de nivel que puede asignar quien ha entrado, para `RoleSelect` en
 * los formularios de alta y edición de cuentas (RFC 0014 D2). El
 * superadministrador no tiene tope, así que no se acota su desplegable.
 */
export function useAssignableRoleBelowLevel(): number | undefined {
  const { data: session } = useSession();
  const catalog = useRoleCatalog();
  const ownRole = session?.user.role ?? DEFAULT_ROLE;

  return ownRole === SUPERADMIN_ROLE ? undefined : catalog.get(ownRole)?.level;
}
