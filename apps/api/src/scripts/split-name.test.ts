import { describe, expect, it } from 'vitest';

import { splitName } from './split-name';

describe('partir un nombre completo', () => {
  it('coge los dos últimos como apellidos, que es lo normal en español', () => {
    expect(splitName('Yolanda Zapata Duque')).toEqual({
      firstName: 'Yolanda',
      lastName: 'Zapata Duque',
    });
    expect(splitName('Luz Fabiola Villada Serna')).toEqual({
      firstName: 'Luz Fabiola',
      lastName: 'Villada Serna',
    });
  });

  it('con dos palabras, una y una', () => {
    expect(splitName('Michel Moreno')).toEqual({ firstName: 'Michel', lastName: 'Moreno' });
  });

  it('con una sola palabra no se inventa un apellido', () => {
    expect(splitName('Esther')).toEqual({ firstName: 'Esther', lastName: '' });
  });

  it('aguanta los espacios de más y los de los lados', () => {
    expect(splitName('  José   Antonio  López Reyes ')).toEqual({
      firstName: 'José Antonio',
      lastName: 'López Reyes',
    });
  });

  it('con la cadena vacía no revienta', () => {
    expect(splitName('   ')).toEqual({ firstName: '', lastName: '' });
  });
});
