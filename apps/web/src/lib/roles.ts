import { useRoles } from '@navis/api-client';
import {
    DEFAULT_ROLE,
    isSystemRole,
    ROLE_HINT_KEY,
    ROLE_LABEL_KEY,
    roleAccent,
    SUPERADMIN_ROLE,
    type RoleRow,
    type RoleSlug,
} from '@navis/shared';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { api } from './api';
import { useSession } from './auth-client';

// Las claves de traducción y el color de cada rol viven en `shared`: el móvil usa los mismos.
export { ROLE_HINT_KEY, ROLE_LABEL_KEY, roleAccent };

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
