import type { TeachingBody, TeachingParagraph } from '@navis/shared';
import { describe, expect, it } from 'vitest';

import { summarizeTeachings, type StatsRow } from './teaching-stats';

const HOY = '2026-08-05';

const parrafo = (texto: string): TeachingParagraph => ({
  type: 'paragraph',
  content: [{ type: 'text', text: texto }],
});

const sinChecklist: TeachingBody = { type: 'doc', content: [parrafo('Sin checks')] };

const conChecklist = (checked: number, total: number): TeachingBody => ({
  type: 'doc',
  content: [
    {
      type: 'taskList',
      content: Array.from({ length: total }, (_, index) => ({
        type: 'taskItem' as const,
        attrs: { checked: index < checked },
        content: [parrafo('ítem')],
      })),
    },
  ],
});

const fila = (overrides: Partial<StatsRow> = {}): StatsRow => ({
  receivedAt: '2026-03-14',
  bodyJson: JSON.stringify(sinChecklist),
  ...overrides,
});

describe('las cuentas de la portada de enseñanzas', () => {
  it('sin ninguna enseñanza, la tasa de checklist es nula y no cero', () => {
    const stats = summarizeTeachings([], HOY);

    expect(stats.total).toBe(0);
    expect(stats.checklistRate).toBeNull();
  });

  it('cuenta lo recibido de este año, y no de otros', () => {
    const stats = summarizeTeachings(
      [fila({ receivedAt: '2025-11-02' }), fila({ receivedAt: '2026-01-20' })],
      HOY,
    );

    expect(stats.total).toBe(2);
    expect(stats.thisYear).toBe(1);
  });

  it('sin ningún ítem de checklist en ninguna enseñanza, la tasa sigue nula', () => {
    const stats = summarizeTeachings([fila(), fila()], HOY);

    expect(stats.checklistRate).toBeNull();
  });

  it('suma los ítems marcados de todas las enseñanzas, no solo de una', () => {
    const stats = summarizeTeachings(
      [
        fila({ bodyJson: JSON.stringify(conChecklist(1, 2)) }),
        fila({ bodyJson: JSON.stringify(conChecklist(2, 2)) }),
      ],
      HOY,
    );

    expect(stats.checklistChecked).toBe(3);
    expect(stats.checklistTotal).toBe(4);
    expect(stats.checklistRate).toBe(0.75);
  });

  it('el gráfico mensual trae los doce meses, con los vacíos a cero', () => {
    const stats = summarizeTeachings([fila({ receivedAt: HOY })], HOY);

    expect(stats.monthly).toHaveLength(12);
    expect(stats.monthly.at(-1)).toEqual({ month: '2026-08', total: 1 });
    expect(stats.monthly[0]).toEqual({ month: '2025-09', total: 0 });
  });
});
