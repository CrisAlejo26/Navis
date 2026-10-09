import { describe, expect, it } from 'vitest';

import { DEFAULT_ROLE } from './constants';
import {
    decideRoleImport,
    effectiveRole,
    linkIdentity,
    matchCandidates,
    resolveAuthor,
} from './sync-identity';

const mine = (id: string, email: string, role = 'pastor') => ({ id, name: id, email, role });
const theirs = (id: string, email: string, role = 'creyente') => ({ id, name: id, email, role });

describe('identidades', () => {
    it('un correo coincidente es un candidato, y la coincidencia ignora mayúsculas y espacios', () => {
        const candidates = matchCandidates(
            [mine('l1', ' Ana@Navis.org ')],
            [theirs('r1', 'ana@navis.org'), theirs('r2', 'otra@navis.org')],
        );
        expect(candidates).toEqual([{ localUserId: 'l1', remoteUserId: 'r1', reason: 'email' }]);
    });

    it('dos cuentas remotas con el mismo correo dan dos candidatos, no una elección automática', () => {
        const candidates = matchCandidates(
            [mine('l1', 'familia@navis.org')],
            [theirs('r1', 'familia@navis.org'), theirs('r2', 'familia@navis.org')],
        );
        expect(candidates).toHaveLength(2);
    });

    it('no vincula una identidad a dos cuentas', () => {
        const links = linkIdentity([], {
            localUserId: 'l1',
            remoteUserId: 'r1',
            verifiedBy: 'device-link',
        });
        expect(() =>
            linkIdentity(links, {
                localUserId: 'l1',
                remoteUserId: 'r2',
                verifiedBy: 'admin-approval',
            }),
        ).toThrow('ya está vinculada');
        expect(() =>
            linkIdentity(links, {
                localUserId: 'l2',
                remoteUserId: 'r1',
                verifiedBy: 'admin-approval',
            }),
        ).toThrow('ya está vinculada');
    });

    it('vincular dos veces la misma pareja no la duplica', () => {
        const link = { localUserId: 'l1', remoteUserId: 'r1', verifiedBy: 'device-link' as const };
        expect(linkIdentity(linkIdentity([], link), link)).toHaveLength(1);
    });

    it('un usuario local sin vincular queda como autor histórico, sin cuenta', () => {
        const links = linkIdentity([], {
            localUserId: 'l1',
            remoteUserId: 'r1',
            verifiedBy: 'device-link',
        });
        expect(resolveAuthor(links, { id: 'l1', name: 'Ana' })).toEqual({
            kind: 'remote',
            userId: 'r1',
        });
        expect(resolveAuthor(links, { id: 'l2', name: 'Luis' })).toEqual({
            kind: 'historical',
            localUserId: 'l2',
            name: 'Luis',
        });
    });

    it('importar un rol no da poder: manda el de la cuenta remota, y sin cuenta, el mínimo', () => {
        expect(effectiveRole(theirs('r1', 'a@b.c', 'creyente'))).toBe('creyente');
        expect(effectiveRole(null)).toBe(DEFAULT_ROLE);
    });
});

describe('importación de roles', () => {
    const system = (slug: string, permissions: string[] = []) => ({
        slug,
        isSystem: true,
        permissions,
    });
    const custom = (slug: string, permissions: string[]) => ({
        slug,
        isSystem: false,
        permissions,
    });

    it('los de serie se mapean a su equivalente', () => {
        expect(decideRoleImport(system('pastor'), [system('pastor', ['*'])])).toBe('map-system');
    });

    it('un rol propio solo se mapea solo si da exactamente los mismos permisos', () => {
        const remotes = [custom('sonido', ['calendar.view', 'believers.view'])];
        expect(
            decideRoleImport(custom('sonido', ['believers.view', 'calendar.view']), remotes),
        ).toBe('map-identical');
        expect(decideRoleImport(custom('sonido', ['calendar.view']), remotes)).toBe('review');
    });

    it('un rol llamado superadmin pero propio y sin equivalente se revisa, no se concede', () => {
        expect(decideRoleImport(custom('superadmin', ['*']), [system('pastor', ['*'])])).toBe(
            'review',
        );
    });

    it('un propio con el nombre de uno de serie remoto pero con otro poder se revisa', () => {
        expect(
            decideRoleImport(custom('pastor', ['*']), [system('pastor', ['believers.view'])]),
        ).toBe('review');
    });
});
