import { describe, expect, it } from 'vitest';

import { isSlotEmpty, joinNames, slotNames } from './slot-people';

describe('joinNames', () => {
    it('un nombre va tal cual y ninguno es vacío', () => {
        expect(joinNames(['Ana'], 'es')).toBe('Ana');
        expect(joinNames([], 'es')).toBe('');
    });

    it('junta varios con la conjunción del idioma', () => {
        expect(joinNames(['Ana', 'Pedro', 'Luis'], 'es')).toBe('Ana, Pedro y Luis');
        expect(joinNames(['Ana', 'Pedro'], 'en')).toBe('Ana and Pedro');
        expect(joinNames(['Ana', 'Pedro'], 'de')).toBe('Ana und Pedro');
    });
});

describe('slotNames', () => {
    it('una fase libre enseña el texto de «sin asignar»', () => {
        expect(slotNames({ believers: [] }, 'es', '—')).toBe('—');
        expect(isSlotEmpty({ believers: [] })).toBe(true);
    });

    it('respeta el orden en que se eligieron', () => {
        const slot = {
            believers: [
                { id: 'b2', name: 'Pedro' },
                { id: 'b1', name: 'Ana' },
            ],
        };
        expect(slotNames(slot, 'es', '—')).toBe('Pedro y Ana');
        expect(isSlotEmpty(slot)).toBe(false);
    });
});
