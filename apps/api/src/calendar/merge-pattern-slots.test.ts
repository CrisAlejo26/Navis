import { describe, expect, it } from 'vitest';

import { mergeSlots, type SlotLike } from './merge-pattern-slots';

const slot = (id: string, name: string, position: number, believerId: string | null = null) =>
    ({ id, name, position, believerId, note: null }) satisfies SlotLike;

describe('mergeSlots', () => {
    // Regresión: una fase añadida al patrón no aparecía en las reuniones que ya
    // estaban materializadas, tuvieran datos o no.
    it('crea vacía la fase nueva y conserva lo asignado', () => {
        const plan = mergeSlots(
            [slot('a', 'Intro', 0, 'b1'), slot('b', 'Predicación', 1)],
            ['Intro', 'Predicación'],
            ['Intro', 'Testimonios', 'Predicación'],
        );

        expect(plan.create).toEqual([{ name: 'Testimonios', position: 1 }]);
        expect(plan.keep).toEqual([
            { id: 'a', position: 0 },
            { id: 'b', position: 2 },
        ]);
        expect(plan.dropIds).toEqual([]);
    });

    it('quita una fase retirada del patrón solo si está vacía', () => {
        const plan = mergeSlots(
            [slot('a', 'Intro', 0), slot('b', 'Cierre', 1, 'b1')],
            ['Intro', 'Cierre'],
            ['Nueva'],
        );

        expect(plan.dropIds).toEqual(['a']);
        expect(plan.keep).toEqual([{ id: 'b', position: 1 }]);
    });

    it('no toca una fase que el usuario añadió a mano a esa reunión', () => {
        const plan = mergeSlots([slot('a', 'Extra', 0)], ['Intro'], ['Intro']);

        expect(plan.dropIds).toEqual([]);
        expect(plan.create).toEqual([{ name: 'Intro', position: 0 }]);
        expect(plan.keep).toEqual([{ id: 'a', position: 1 }]);
    });
});
