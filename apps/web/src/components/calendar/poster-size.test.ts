import type { CalendarRange } from '@navis/shared';
import { describe, expect, it } from 'vitest';

import { posterWidth, TABLE_COLUMN, tableWeeks } from './poster-size';

const reunion = (congregationId: string, conNombre: boolean) => ({
  id: 'm1',
  congregationId,
  patternId: null,
  name: 'Culto',
  startTime: '19:00',
  accent: 'primary',
  status: 'programada' as const,
  notes: null,
  slots: [
    {
      id: 's1',
      name: 'Introducción',
      position: 0,
      note: null,
      believer: conNombre ? { id: 'b1', name: 'Carlos' } : null,
    },
  ],
});

/** Dos semanas: la primera con tres sedes el lunes, la segunda con una. */
const tramo: CalendarRange = {
  from: '2026-08-03',
  to: '2026-08-16',
  congregations: [],
  days: [
    {
      date: '2026-08-03',
      meetings: [reunion('elda', true), reunion('alicante', true), reunion('benidorm', true)],
    },
    { date: '2026-08-04', meetings: [reunion('elda', false)] },
    { date: '2026-08-10', meetings: [reunion('elda', true)] },
  ],
};

describe('la lámina en tabla', () => {
  it('parte las columnas por semanas, una debajo de otra', () => {
    const semanas = tableWeeks(tramo);

    expect(semanas.map((semana) => semana.from)).toEqual(['2026-08-03', '2026-08-10']);
    expect(semanas[0]?.columns).toHaveLength(3);
    expect(semanas[1]?.columns).toHaveLength(1);
  });

  it('deja fuera lo que no tiene a nadie: se comparte lo repartido', () => {
    const columnas = tableWeeks(tramo).flatMap((semana) => semana.columns);

    expect(columnas.some((columna) => columna.date === '2026-08-04')).toBe(false);
  });

  it('el ancho lo marca la semana más cargada, no la suma de todas', () => {
    // Tres columnas la primera semana y una la segunda: manda el tres.
    expect(posterWidth('table', tramo)).toBe(Math.max(1080, 3 * TABLE_COLUMN + 88));
  });
});
