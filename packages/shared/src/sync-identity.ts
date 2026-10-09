import { DEFAULT_ROLE } from './constants';

/**
 * Identidades y roles al unir un teléfono con una instalación (Fase 3 del plan
 * de sincronización). Tres reglas, todas de seguridad:
 *
 * 1. Un correo coincidente es un **candidato**, nunca una prueba: dos personas
 *    comparten correo en una familia, y vincular a ciegas dejaría a alguien con
 *    la cuenta de otro. Solo se vincula con una verificación (`device-link`, el
 *    token que se generó desde una sesión de esa cuenta) o con aprobación.
 * 2. Los usuarios locales sin vincular **no ganan sesión**: se conservan como
 *    autores históricos, sin acceso, hasta que alguien los invite.
 * 3. Importar un rol no concede su poder: manda el rol que la cuenta remota ya
 *    tiene. Un rol local llamado «Pastor» o «Superadmin» no vale nada solo por
 *    su nombre.
 */
export interface LocalIdentity {
    id: string;
    name: string;
    email: string;
    role: string;
}

export interface RemoteIdentity {
    id: string;
    name: string;
    email: string;
    role: string;
}

export type IdentityVerification = 'device-link' | 'admin-approval';

export interface IdentityLink {
    localUserId: string;
    remoteUserId: string;
    verifiedBy: IdentityVerification;
}

export interface IdentityCandidate {
    localUserId: string;
    remoteUserId: string;
    reason: 'email';
}

const normalize = (email: string): string => email.trim().toLowerCase();

/** Parejas que **podrían** ser la misma persona. Quien las usa tiene que pedir confirmación. */
export function matchCandidates(
    locals: readonly LocalIdentity[],
    remotes: readonly RemoteIdentity[],
): IdentityCandidate[] {
    const byEmail = new Map<string, RemoteIdentity[]>();
    for (const remote of remotes) {
        const key = normalize(remote.email);
        byEmail.set(key, [...(byEmail.get(key) ?? []), remote]);
    }
    return locals.flatMap((local) =>
        (byEmail.get(normalize(local.email)) ?? []).map((remote) => ({
            localUserId: local.id,
            remoteUserId: remote.id,
            reason: 'email' as const,
        })),
    );
}

/** Añade un vínculo verificado; una identidad solo puede estar vinculada a una del otro lado. */
export function linkIdentity(links: readonly IdentityLink[], next: IdentityLink): IdentityLink[] {
    const clash = links.find(
        (link) =>
            (link.localUserId === next.localUserId && link.remoteUserId !== next.remoteUserId) ||
            (link.remoteUserId === next.remoteUserId && link.localUserId !== next.localUserId),
    );
    if (clash) throw new Error('Esa identidad ya está vinculada a otra cuenta');
    if (links.some((link) => link.localUserId === next.localUserId)) return [...links];
    return [...links, next];
}

export type ResolvedAuthor =
    { kind: 'remote'; userId: string } | { kind: 'historical'; localUserId: string; name: string };

/** De quién es una autoría local: de la cuenta remota vinculada o, si no hay, un autor histórico sin acceso. */
export function resolveAuthor(
    links: readonly IdentityLink[],
    local: Pick<LocalIdentity, 'id' | 'name'>,
): ResolvedAuthor {
    const link = links.find((one) => one.localUserId === local.id);
    return link
        ? { kind: 'remote', userId: link.remoteUserId }
        : { kind: 'historical', localUserId: local.id, name: local.name };
}

/**
 * El rol que tendrá en la instalación quien se vincula: el que su cuenta remota
 * ya tiene. El rol local no cuenta, ni como tope ni como punto de partida; sin
 * cuenta remota, el de menos privilegio.
 */
export function effectiveRole(remote: Pick<RemoteIdentity, 'role'> | null): string {
    return remote?.role ?? DEFAULT_ROLE;
}

export interface RoleSnapshot {
    slug: string;
    isSystem: boolean;
    permissions: readonly string[];
}

export type RoleImportDecision = 'map-system' | 'map-identical' | 'review';

const samePermissions = (a: readonly string[], b: readonly string[]): boolean =>
    a.length === b.length && [...a].sort().join('|') === [...b].sort().join('|');

/**
 * Qué hacer con un rol del teléfono al unirlo: los de serie se mapean a su
 * equivalente remoto; uno propio solo se mapea solo si el remoto con el mismo
 * slug da **exactamente** los mismos permisos; en cualquier otro caso lo decide
 * una persona, comparando permisos.
 */
export function decideRoleImport(
    local: RoleSnapshot,
    remotes: readonly RoleSnapshot[],
): RoleImportDecision {
    const remote = remotes.find((one) => one.slug === local.slug);
    if (!remote) return 'review';
    if (local.isSystem && remote.isSystem) return 'map-system';
    return samePermissions(local.permissions, remote.permissions) ? 'map-identical' : 'review';
}
