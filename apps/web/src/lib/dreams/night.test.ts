import { describe, expect, it } from 'vitest';

import { proposedNight } from '@/lib/dreams/night';

/**
 * Las horas se construyen **locales** (`new Date(a, m, d, h)`) a propósito: es
 * lo que mira `proposedNight`, y con una hora en UTC el test diría cosas
 * distintas según dónde se ejecute.
 */
describe('la noche que se propone', () => {
  it('propone hoy cuando se escribe de día', () => {
    expect(proposedNight(new Date(2026, 7, 5, 11, 0))).toBe('2026-08-05');
  });

  /* El caso que justifica que esto exista: a las cuatro de la mañana el sueño
     es de anoche, y proponer hoy obliga a corregir la fecha medio dormido. */
  it('propone anoche cuando se escribe de madrugada', () => {
    expect(proposedNight(new Date(2026, 7, 5, 4, 30))).toBe('2026-08-04');
  });

  it('cambia justo a las seis', () => {
    expect(proposedNight(new Date(2026, 7, 5, 5, 59))).toBe('2026-08-04');
    expect(proposedNight(new Date(2026, 7, 5, 6, 0))).toBe('2026-08-05');
  });

  it('cruza el mes hacia atrás sin inventarse el día', () => {
    expect(proposedNight(new Date(2026, 7, 1, 2, 0))).toBe('2026-07-31');
  });
});
