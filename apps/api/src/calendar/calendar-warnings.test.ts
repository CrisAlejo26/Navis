import { describe, expect, it } from 'vitest';

import { buildWarnings, type Assignment } from './calendar-warnings';

const asignacion = (
  believerId: string,
  date: string,
  congregationId = 'elda',
  detail = 'Culto · Enseñanza',
): Assignment => ({ believerId, name: 'Luis Fernando', date, congregationId, detail });

describe('avisos de reparto del calendario', () => {
  it('avisa de las fases que se han quedado sin nadie', () => {
    const avisos = buildWarnings(
      [],
      [{ date: '2026-08-15', congregationId: 'elda', detail: 'Culto · Enseñanza' }],
    );

    expect(avisos).toHaveLength(1);
    expect(avisos[0]).toMatchObject({ kind: 'unassigned', date: '2026-08-15' });
  });

  it('avisa cuando alguien ocupa dos fases del mismo día en la misma sede', () => {
    const avisos = buildWarnings(
      [asignacion('b1', '2026-08-15'), asignacion('b1', '2026-08-15', 'elda', 'Culto · Cierre')],
      [],
    );

    expect(avisos.map((aviso) => aviso.kind)).toEqual(['twiceSameDay']);
  });

  it('distingue el mismo día en dos sedes, porque hay que desplazarse', () => {
    const avisos = buildWarnings(
      [asignacion('b1', '2026-08-15', 'elda'), asignacion('b1', '2026-08-15', 'alicante')],
      [],
    );

    expect(avisos.map((aviso) => aviso.kind)).toEqual(['twoVenues']);
  });

  it('avisa de dos días seguidos, y no de dos días con hueco', () => {
    const seguidos = buildWarnings(
      [asignacion('b1', '2026-08-15'), asignacion('b1', '2026-08-16')],
      [],
    );
    const separados = buildWarnings(
      [asignacion('b1', '2026-08-15'), asignacion('b1', '2026-08-17')],
      [],
    );

    expect(seguidos.map((aviso) => aviso.kind)).toEqual(['backToBack']);
    expect(seguidos[0]?.detail).toBe('2026-08-15');
    expect(separados).toEqual([]);
  });

  it('no mezcla a dos personas distintas en el mismo aviso', () => {
    const avisos = buildWarnings(
      [asignacion('b1', '2026-08-15'), asignacion('b2', '2026-08-16')],
      [],
    );

    expect(avisos).toEqual([]);
  });
});
