import { describe, expect, it } from 'vitest';

import { leadingBlanks } from './poster-grid-blanks';

describe('las celdas en blanco antes del primer día de la lámina', () => {
  it('no hace falta ninguna si el tramo ya empieza en lunes', () => {
    // 2026-08-03 es lunes: es justo lo que ya piden semana, dos, tres y
    // cuatro semanas al calcular el tramo desde `startOfWeek`.
    expect(leadingBlanks('2026-08-03')).toBe(0);
  });

  it('cuenta desde el lunes cuando el mes no empieza en lunes', () => {
    // 2026-09-01 es martes: una celda en blanco antes, o el 1 caería bajo
    // la cabecera de «LUN» en vez de la de «MAR» (el bug que reportó un
    // usuario: los días de septiembre salían un día antes de la cuenta).
    expect(leadingBlanks('2026-09-01')).toBe(1);
    // 2026-11-01 es domingo: seis celdas en blanco para llegar a la última
    // columna de la semana.
    expect(leadingBlanks('2026-11-01')).toBe(6);
  });

  it('sin ningún día, no hay nada que alinear', () => {
    expect(leadingBlanks(undefined)).toBe(0);
  });
});
