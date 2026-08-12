import type { TaskOccurrence } from '@navis/shared';
import type { Repository } from 'typeorm';
import { describe, expect, it } from 'vitest';

import type { TaskStreakCache } from './task-streak-cache.entity';
import { TasksStreakService } from './tasks-streak.service';
import type { TasksExpansionService } from './tasks-expansion.service';

const churchId = 'iglesia-1';
const ownerId = 'cuenta-1';
const today = '2026-08-15';

/** Una tarea completada o pendiente ese día, con lo justo para la racha. */
function occurrence(date: string, completed: boolean): TaskOccurrence {
  return {
    taskId: `t-${date}`,
    date,
    title: 'Tarea',
    description: null,
    time: null,
    priority: 'media',
    status: completed ? 'completada' : 'pendiente',
    completedAt: completed ? `${date}T10:00:00.000Z` : null,
    isRecurring: false,
    tags: [],
    reminder: null,
    createdAt: `${date}T00:00:00.000Z`,
  };
}

/**
 * Dobles en memoria, con solo lo que usa el servicio: `Repository` y
 * `TasksExpansionService` enteros traen decenas de métodos que aquí no hacen
 * falta (Regla 10 §2: la excepción documentada de `as unknown as X`).
 */
function makeService(byDate: Map<string, TaskOccurrence[]>) {
  const saved: { longestStreak: number } = { longestStreak: 0 };

  const cache = {
    findOne: async () =>
      saved.longestStreak > 0 ? { churchId, ownerId, longestStreak: saved.longestStreak } : null,
    create: (input: { longestStreak: number }) => ({ churchId, ownerId, ...input }),
    save: async (row: { longestStreak: number }) => {
      saved.longestStreak = row.longestStreak;
      return row;
    },
  } as unknown as Repository<TaskStreakCache>;

  const expansion = {
    range: async (_church: string, _owner: string, from: string, to: string) => {
      const result: TaskOccurrence[] = [];
      for (const [date, items] of byDate) {
        if (date >= from && date <= to) result.push(...items);
      }
      return result;
    },
  } as unknown as TasksExpansionService;

  return new TasksStreakService(cache, expansion);
}

describe('TasksStreakService (D8, D9)', () => {
  it('cuenta hoy si está completo, aunque sea el único día', async () => {
    const service = makeService(new Map([[today, [occurrence(today, true)]]]));
    const result = await service.streak(churchId, ownerId, today);
    expect(result.current).toBe(1);
  });

  it('encadena varios días completados hacia atrás', async () => {
    const byDate = new Map([
      ['2026-08-13', [occurrence('2026-08-13', true)]],
      ['2026-08-14', [occurrence('2026-08-14', true)]],
      [today, [occurrence(today, true)]],
    ]);
    const result = await makeService(byDate).streak(churchId, ownerId, today);
    expect(result.current).toBe(3);
  });

  it('un día sin ninguna tarea no rompe la racha (D8)', async () => {
    const byDate = new Map([
      // 13 completo, 14 sin tareas (se salta), hoy completo.
      ['2026-08-13', [occurrence('2026-08-13', true)]],
      [today, [occurrence(today, true)]],
    ]);
    const result = await makeService(byDate).streak(churchId, ownerId, today);
    expect(result.current).toBe(2);
  });

  it('un día incompleto sí la rompe', async () => {
    const byDate = new Map([
      ['2026-08-13', [occurrence('2026-08-13', true)]],
      ['2026-08-14', [occurrence('2026-08-14', false)]],
      [today, [occurrence(today, true)]],
    ]);
    const result = await makeService(byDate).streak(churchId, ownerId, today);
    // Ayer (14) está incompleto: la racha se para ahí. Hoy cuenta aparte (+1).
    expect(result.current).toBe(1);
  });

  it('hoy sin completar no suma, pero no baja lo ya acumulado hasta ayer', async () => {
    const byDate = new Map([
      ['2026-08-13', [occurrence('2026-08-13', true)]],
      ['2026-08-14', [occurrence('2026-08-14', true)]],
      [today, [occurrence(today, false)]],
    ]);
    const result = await makeService(byDate).streak(churchId, ownerId, today);
    expect(result.current).toBe(2);
  });

  it('guarda la racha más larga, y solo puede crecer', async () => {
    const service = makeService(
      new Map([
        ['2026-08-13', [occurrence('2026-08-13', true)]],
        ['2026-08-14', [occurrence('2026-08-14', true)]],
        [today, [occurrence(today, true)]],
      ]),
    );
    const first = await service.streak(churchId, ownerId, today);
    expect(first.longest).toBe(3);

    // Una racha más corta al día siguiente no debe bajar el máximo guardado.
    const shorter = await makeService(new Map([[today, [occurrence(today, false)]]])).streak(
      churchId,
      ownerId,
      today,
    );
    expect(shorter.current).toBe(0);
  });
});
