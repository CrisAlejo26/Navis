import { describe, expect, it } from 'vitest';

import { featuredTagFromLinks, linksWithFeatured } from './sync-legacy';

const links = [
    { id: 'l1', tag_id: 't1', featured: 0, deleted_at: null },
    { id: 'l2', tag_id: 't2', featured: 0, deleted_at: null },
];

describe('destacado heredado', () => {
    it('marca solo el vínculo de la etiqueta destacada de la ficha', () => {
        const wire = linksWithFeatured(links, 't2');
        expect(wire.map((link) => link.featured)).toEqual([0, 1]);
    });

    it('sin destacado en la ficha ningún vínculo sale marcado', () => {
        expect(linksWithFeatured(links, null).every((link) => link.featured === 0)).toBe(true);
    });

    it('vuelve a la ficha con la misma etiqueta', () => {
        expect(featuredTagFromLinks(linksWithFeatured(links, 't1'))).toBe('t1');
    });

    it('ignora un vínculo destacado pero borrado', () => {
        const deleted = [{ ...links[0], featured: 1, deleted_at: '2026-01-01T00:00:00.000Z' }];
        expect(featuredTagFromLinks(deleted)).toBeNull();
    });
});
