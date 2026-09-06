import { describe, expect, it } from 'vitest';

import { accentHex } from './accent-hex';
import { themeColorsHex } from './tokens';

describe('accentHex', () => {
  it('devuelve un hex de la paleta ampliada tal cual', () => {
    expect(accentHex('#0284c7')).toBe('#0284c7');
  });

  it('resuelve los tokens de siempre según el tema', () => {
    expect(accentHex('primary', 'light')).toBe(themeColorsHex.light.primary);
    expect(accentHex('primary', 'dark')).toBe(themeColorsHex.dark.primary);
    expect(accentHex('warning', 'dark')).toBe(themeColorsHex.dark.warning);
  });

  it('el azul de marca no cambia con el tema', () => {
    expect(accentHex('brand', 'light')).toBe(accentHex('brand', 'dark'));
  });

  it('cae a primary en claro si el acento no se reconoce', () => {
    expect(accentHex('lo-que-sea')).toBe(themeColorsHex.light.primary);
  });

  it('claro es el valor por defecto cuando no se pasa tema', () => {
    expect(accentHex('success')).toBe(themeColorsHex.light.success);
  });
});
