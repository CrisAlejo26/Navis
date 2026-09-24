import { formatAgo } from './format';

// Regresión: `formatAgo` usaba `Intl.RelativeTimeFormat`, que Hermes en
// Android no trae de serie (sí `DateTimeFormat`/`NumberFormat`) — reventaba
// con «undefined cannot be used as a constructor» en cuanto el panel de
// inicio pintaba a alguien que «pide atención» (justo al sembrar datos de
// prueba). Ahora sale de `common.*` con i18next, que no depende de ningún
// `Intl` que Hermes pueda no traer.
describe('formatAgo', () => {
    it('hoy, y en días por debajo de una semana', () => {
        expect(formatAgo(0)).toBe('Hoy');
        expect(formatAgo(1)).toBe('hace 1 día');
        expect(formatAgo(3)).toBe('hace 3 días');
    });

    it('pasa a semanas entre siete días y un mes', () => {
        expect(formatAgo(7)).toBe('hace 1 semana');
        expect(formatAgo(20)).toBe('hace 3 semanas');
    });

    it('pasa a meses y a años a partir de ahí', () => {
        expect(formatAgo(60)).toBe('hace 2 meses');
        expect(formatAgo(400)).toBe('hace 1 año');
    });
});
