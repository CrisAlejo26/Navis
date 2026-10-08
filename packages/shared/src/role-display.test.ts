import { describe, expect, it } from 'vitest';

import { ROLES } from './constants';
import { ROLE_HINT_KEY, ROLE_LABEL_KEY, roleColor } from './role-display';
import { ACCENT_PALETTE } from './schemas/congregations';

describe('presentación de los roles', () => {
    it('cada rol de serie tiene un color propio de la paleta de acentos', () => {
        const colors = ROLES.map((slug) => roleColor({ slug, level: 0 }));
        expect(new Set(colors).size).toBe(ROLES.length);
        for (const color of colors) expect(ACCENT_PALETTE as readonly string[]).toContain(color);
    });

    it('un rol de la instalación toma el color de su nivel, y el de serie ignora el nivel', () => {
        expect(roleColor({ slug: 'tesoreria', level: 1 })).toBe(ACCENT_PALETTE[1]);
        expect(roleColor({ slug: 'tesoreria', level: 2 })).toBe(ACCENT_PALETTE[2]);
        expect(roleColor({ slug: 'pastor', level: 99 })).toBe(
            roleColor({ slug: 'pastor', level: 0 }),
        );
    });

    it('hay una clave de nombre y una de descripción por cada rol de serie', () => {
        expect(Object.keys(ROLE_LABEL_KEY).sort()).toEqual([...ROLES].sort());
        expect(Object.keys(ROLE_HINT_KEY).sort()).toEqual([...ROLES].sort());
    });
});
