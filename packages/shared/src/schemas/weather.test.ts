import { describe, expect, it } from 'vitest';

import { weatherKindOf } from './weather';

describe('weatherKindOf', () => {
  it('agrupa los códigos WMO en las familias que enseña la interfaz', () => {
    expect(weatherKindOf(0)).toBe('clear');
    expect(weatherKindOf(2)).toBe('cloudy');
    expect(weatherKindOf(45)).toBe('fog');
    expect(weatherKindOf(53)).toBe('drizzle');
    expect(weatherKindOf(63)).toBe('rain');
    expect(weatherKindOf(73)).toBe('snow');
    expect(weatherKindOf(81)).toBe('showers');
    // 85 y 86 son chubascos de nieve: pesa más la nieve que el chubasco.
    expect(weatherKindOf(85)).toBe('snow');
    expect(weatherKindOf(95)).toBe('storm');
  });
});
