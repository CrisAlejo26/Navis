import type { CalendarRange } from '@navis/shared';
import { describe, expect, it } from 'vitest';

import { rangeAsText } from './share-text';

const reunion = (name: string, congregationId: string, startTime: string) => ({
  id: 'm1',
  congregationId,
  patternId: null,
  name,
  startTime,
  accent: 'primary',
  status: 'programada' as const,
  notes: null,
  slots: [
    {
      id: 's1',
      name: 'Introducción',
      position: 0,
      note: null,
      believer: { id: 'b1', name: 'Juan Carlos' },
    },
    { id: 's2', name: 'Enseñanza', position: 1, note: null, believer: null },
  ],
});

const tramo: CalendarRange = {
  from: '2026-08-15',
  to: '2026-08-15',
  congregations: [],
  days: [{ date: '2026-08-15', meetings: [reunion('Culto', 'elda', '20:00')] }],
};

const opciones = {
  dayLabel: () => 'Viernes 15 de agosto',
  congregationName: () => 'Elda',
  showCongregation: true,
  unassigned: 'Sin asignar',
};

describe('el tramo como texto para pegar en el grupo', () => {
  it('escribe el día, la sede, la reunión y cada fase con su persona', () => {
    expect(rangeAsText(tramo, opciones)).toBe(
      [
        'Viernes 15 de agosto · Elda',
        '  Culto (20:00)',
        '  Introducción · Juan Carlos',
        '  Enseñanza · Sin asignar',
      ].join('\n'),
    );
  });

  it('con una sola sede no la nombra', () => {
    const texto = rangeAsText(tramo, { ...opciones, showCongregation: false });
    expect(texto.startsWith('Viernes 15 de agosto\n')).toBe(true);
  });

  it('deja fuera los días sin nada y las reuniones canceladas', () => {
    const conCancelada: CalendarRange = {
      ...tramo,
      days: [
        { date: '2026-08-14', meetings: [] },
        {
          date: '2026-08-15',
          meetings: [{ ...reunion('Culto', 'elda', '20:00'), status: 'cancelada' as const }],
        },
      ],
    };

    expect(rangeAsText(conCancelada, opciones)).toBe('');
  });
});
