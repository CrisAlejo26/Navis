import { describe, expect, it } from 'vitest';

import { recordVisibility } from './sync-privacy';
import { scopeSql } from './sync-trigger-sql';

describe('visibilidad por registro', () => {
    it('una nota de creyente es de la iglesia, aunque la haya escrito alguien', () => {
        expect(
            recordVisibility('believer_notes', { id: 'n1', church_id: 'c1', author_id: 'u1' }),
        ).toEqual({ kind: 'church', churchId: 'c1' });
    });

    it('dos personas de la misma iglesia: cada tarea es solo de su dueño', () => {
        const ana = recordVisibility('tasks', { id: 't1', church_id: 'c1', owner_id: 'ana' });
        const luis = recordVisibility('tasks', { id: 't2', church_id: 'c1', owner_id: 'luis' });
        expect(ana).toEqual({ kind: 'private', ownerId: 'ana', churchId: 'c1' });
        expect(luis).toEqual({ kind: 'private', ownerId: 'luis', churchId: 'c1' });
    });

    it('una profecía es de su dueño y de ninguna iglesia', () => {
        expect(recordVisibility('prophecies', { id: 'p1', owner_id: 'ana' })).toEqual({
            kind: 'private',
            ownerId: 'ana',
            churchId: null,
        });
    });

    it('la iglesia es de sus miembros, no solo de quien la creó', () => {
        expect(recordVisibility('churches', { id: 'c1', owner_id: 'ana' })).toEqual({
            kind: 'church',
            churchId: 'c1',
        });
    });

    it('los catálogos son de todos y las filas hijas heredan', () => {
        expect(recordVisibility('roles', { id: 'r1' })).toEqual({ kind: 'system' });
        expect(recordVisibility('believer_tag_links', { id: 'l1' })).toEqual({ kind: 'inherits' });
    });

    it('un dato personal sin dueño es un error de datos, no un dato público', () => {
        expect(() => recordVisibility('dreams', { id: 'd1', owner_id: null })).toThrow('sin dueño');
    });

    it('coincide con lo que calculan los triggers del registro de cambios', () => {
        // Si el trigger dice que una tabla tiene dueño, la función también.
        expect(scopeSql('tasks', 'NEW').owner).toBe('NEW.owner_id');
        expect(scopeSql('believer_notes', 'NEW').owner).toBe('NULL');
        expect(scopeSql('prophecies', 'NEW')).toEqual({ church: 'NULL', owner: 'NEW.owner_id' });
    });
});
