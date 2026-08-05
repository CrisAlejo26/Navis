import { describe, expect, it } from 'vitest';

import { toExcelSerial } from './serial';

describe('toExcelSerial', () => {
  /**
   * Los dos valores de referencia de cualquier implementación: Excel cuenta
   * desde el 30 de diciembre de 1899 porque se cree que 1900 fue bisiesto.
   */
  it('coincide con los números de serie que usa Excel', () => {
    expect(toExcelSerial('1900-03-01')).toBe(61);
    expect(toExcelSerial('2000-01-01')).toBe(36526);
  });

  it('cuenta un día entre dos días seguidos', () => {
    const uno = toExcelSerial('2026-08-05');
    const otro = toExcelSerial('2026-08-06');

    expect(uno).not.toBeNull();
    expect(otro).toBe((uno ?? 0) + 1);
  });

  /**
   * La conversión es **en UTC y a mano**: con `new Date('2026-03-14')` y los
   * getters locales, cualquier huso al oeste de Greenwich devolvería el día
   * anterior, que es la trampa que ya está anotada en CLAUDE.md.
   */
  it('no se desplaza un día por el huso horario', () => {
    expect(toExcelSerial('2026-03-14T00:00:00.000Z')).toBe(toExcelSerial('2026-03-14'));
  });

  it('devuelve null si no es un día de calendario', () => {
    expect(toExcelSerial('')).toBeNull();
    expect(toExcelSerial('ayer')).toBeNull();
  });
});
