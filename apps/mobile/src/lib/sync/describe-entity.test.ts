import { describeEntity, humanizeField } from './describe-entity';

describe('nombrar una entidad en pantalla', () => {
    it('una persona, por su nombre completo', () => {
        expect(describeEntity('believers', { first_name: 'Ana', last_name: 'Pérez' })).toBe(
            'Ana Pérez',
        );
        expect(describeEntity('believers', { first_name: 'Ana', last_name: '' })).toBe('Ana');
    });

    it('lo demás, por su título o su nombre, recortado si es largo', () => {
        expect(describeEntity('journal_entries', { title: 'Visita a Juan' })).toBe('Visita a Juan');
        expect(describeEntity('gifts', { name: 'Sanidad' })).toBe('Sanidad');
        expect(describeEntity('prophecies', { title: 'x'.repeat(80) }).length).toBeLessThanOrEqual(
            48,
        );
    });

    it('sin nada legible, por su tabla y nunca por un identificador', () => {
        expect(describeEntity('list_members', { list_id: 'abc' })).toBe('list_members');
        expect(describeEntity('believers', null)).toBe('believers');
    });

    it('los campos se leen sin guiones bajos', () => {
        expect(humanizeField('arrival_site')).toBe('arrival site');
    });
});
