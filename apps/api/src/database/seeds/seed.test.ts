import { describe, expect, it } from 'vitest';

import { assertSeedAllowed } from './seed-guard';

// Regresión: la semilla llegó a correr contra el servidor y dejó
// `admin@navis.local` como única cuenta de producción, con la contraseña que
// está escrita en `seed.ts` y que cualquiera puede leer en GitHub.
describe('assertSeedAllowed', () => {
  it('deja pasar la semilla fuera de producción', () => {
    expect(() => {
      assertSeedAllowed(false);
    }).not.toThrow();
  });

  it('se niega a sembrar en producción, porque la contraseña es pública', () => {
    expect(() => {
      assertSeedAllowed(true);
    }).toThrow(/no se ejecuta en producción/);
  });
});
