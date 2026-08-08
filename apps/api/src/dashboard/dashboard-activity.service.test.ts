import type { Repository } from 'typeorm';
import { describe, expect, it, vi } from 'vitest';

import type { BelieverNote } from '../believers/believer-note.entity';
import { DashboardActivityService } from './dashboard-activity.service';

function build(occurredAts: string[]) {
  const repo = {
    find: vi.fn(() =>
      Promise.resolve(occurredAts.map((occurredAt) => ({ occurredAt }) as BelieverNote)),
    ),
  } as unknown as Repository<BelieverNote>;

  return { service: new DashboardActivityService(repo) };
}

describe('la actividad semanal de la portada', () => {
  it('devuelve seis semanas, la más antigua primero, terminando en la de hoy', async () => {
    const { service } = build([]);

    // Miércoles: su semana (lunes a domingo) es la última de las seis.
    const semanas = await service.weekly('c1', '2026-08-05');

    expect(semanas).toHaveLength(6);
    expect(semanas[0]?.week).toBe('2026-06-29');
    expect(semanas[5]?.week).toBe('2026-08-03');
  });

  it('rellena con cero la semana sin ninguna nota, no la omite', async () => {
    const { service } = build(['2026-08-04']); // martes de la semana de hoy

    const semanas = await service.weekly('c1', '2026-08-05');

    expect(semanas.map((one) => one.notes)).toEqual([0, 0, 0, 0, 0, 1]);
  });

  it('cuenta varias notas de la misma semana juntas', async () => {
    const { service } = build(['2026-08-04', '2026-08-05', '2026-07-28']);

    const semanas = await service.weekly('c1', '2026-08-05');

    expect(semanas.at(-1)).toEqual({ week: '2026-08-03', notes: 2 });
    expect(semanas.at(-2)).toEqual({ week: '2026-07-27', notes: 1 });
  });
});
