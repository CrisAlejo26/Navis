import { describe, expect, it } from 'vitest';

import { GREETING_KEY, greetingKeyFor } from '@/lib/greeting';

/** Una fecha cualquiera a la hora local que se quiera probar. */
const aLas = (hour: number) => new Date(2026, 7, 3, hour, 30);

describe('greetingKeyFor', () => {
  it('saluda por la mañana entre las seis y las doce', () => {
    expect(greetingKeyFor(aLas(6))).toBe(GREETING_KEY.morning);
    expect(greetingKeyFor(aLas(11))).toBe(GREETING_KEY.morning);
  });

  it('saluda por la tarde desde las doce hasta las ocho', () => {
    expect(greetingKeyFor(aLas(12))).toBe(GREETING_KEY.afternoon);
    expect(greetingKeyFor(aLas(19))).toBe(GREETING_KEY.afternoon);
  });

  it('saluda por la noche a partir de las ocho', () => {
    expect(greetingKeyFor(aLas(20))).toBe(GREETING_KEY.evening);
    expect(greetingKeyFor(aLas(23))).toBe(GREETING_KEY.evening);
  });

  // La madrugada es noche: a las tres nadie da los buenos días.
  it('trata la madrugada como noche', () => {
    expect(greetingKeyFor(aLas(0))).toBe(GREETING_KEY.evening);
    expect(greetingKeyFor(aLas(5))).toBe(GREETING_KEY.evening);
  });
});
