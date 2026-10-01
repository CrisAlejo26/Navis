import { describe, expect, it } from 'vitest';
import { CHURCH_ICONS, churchEmblem } from './church-emblem';

describe('emblema compartido', () => {
    it('conserva ejemplos del hash original web', () => {
        expect(churchEmblem('c1')).toEqual({ icon: 'telescope', tint: 5 });
        expect(churchEmblem('c2')).toEqual({ icon: 'route', tint: 6 });
        expect(churchEmblem('')).toEqual({ icon: 'anchor', tint: 1 });
        expect(churchEmblem('c1')).toEqual(churchEmblem('c1'));
    });
    it('reparte ids entre los doce iconos y los seis tintes', () => {
        const emblems = Array.from({ length: 1000 }, (_, i) => churchEmblem(`iglesia-${i}`));
        expect(new Set(emblems.map((e) => e.icon)).size).toBe(CHURCH_ICONS.length);
        expect([...new Set(emblems.map((e) => e.tint))].sort()).toEqual([1, 2, 3, 4, 5, 6]);
    });
});
