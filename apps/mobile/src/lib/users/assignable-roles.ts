import { SUPERADMIN_ROLE, canAssignRoleLevel, type RoleRow } from '@navis/shared';

/**
 * Los roles que quien pregunta puede repartir (RFC 0014 D2): nunca el suyo ni
 * uno por encima. El superadministrador no tiene tope. Es el mismo cálculo que
 * hace el servidor al guardar; aquí solo evita ofrecer lo que va a rechazar.
 */
export function assignableRoles(roles: readonly RoleRow[], mySlug: string | undefined): RoleRow[] {
    if (mySlug === SUPERADMIN_ROLE) return [...roles];
    const mine = roles.find((role) => role.slug === mySlug);
    if (!mine) return [];
    return roles.filter((role) => canAssignRoleLevel(mine.level, role.level));
}
