import { describe, expect, it } from 'vitest';
import { moveInTaskOrder, moveSelectedTasks } from './task-order';
describe('borrador de orden manual', () => {
    const items = ['a', 'b', 'c', 'd'].map((id) => ({ id }));
    it('arrastra hacia arriba y abajo sin tocar la fuente', () => {
        expect(moveInTaskOrder(items, 0, 3).map((row) => row.id)).toEqual(['b', 'c', 'd', 'a']);
        expect(moveInTaskOrder(items, 3, 0).map((row) => row.id)).toEqual(['d', 'a', 'b', 'c']);
        expect(items.map((row) => row.id)).toEqual(['a', 'b', 'c', 'd']);
    });
    it('mueve un bloque seleccionado manteniendo su orden y respeta los límites', () => {
        const up = moveSelectedTasks(items, ['b', 'c'], -1);
        expect(up.map((row) => row.id)).toEqual(['b', 'c', 'a', 'd']);
        expect(moveSelectedTasks(up, ['b', 'c'], -1)).toEqual(up);
        expect(moveSelectedTasks(items, ['b', 'c'], 1).map((row) => row.id)).toEqual(['a', 'd', 'b', 'c']);
    });
});
