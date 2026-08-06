import type { CalendarRange } from '@navis/shared';
import { describe, expect, it } from 'vitest';

import { isCalendarRange, withAssignment } from './calendar-cache';

const tramo: CalendarRange = {
  from: '2026-08-14',
  to: '2026-08-15',
  congregations: [],
  days: [
    { date: '2026-08-14', meetings: [], holiday: null },
    {
      date: '2026-08-15',
      holiday: null,
      meetings: [
        {
          id: null,
          congregationId: 'elda',
          patternId: 'p1',
          name: 'Culto',
          startTime: '20:00',
          accent: 'success',
          status: 'programada',
          notes: null,
          slots: [
            { id: null, name: 'Introducción', position: 0, note: null, believer: null },
            { id: null, name: 'Enseñanza', position: 1, note: null, believer: null },
          ],
        },
      ],
    },
  ],
};

describe('parcheo optimista del calendario', () => {
  it('pone a la persona en su fase sin tocar el resto del tramo', () => {
    const conAsignacion = withAssignment(tramo, {
      date: '2026-08-15',
      patternId: 'p1',
      position: 1,
      believerId: 'b1',
      believerName: 'Luis Fernando',
    });

    const reunion = conAsignacion.days[1]?.meetings[0];
    expect(reunion?.slots[1]?.believer).toEqual({ id: 'b1', name: 'Luis Fernando' });
    expect(reunion?.slots[0]?.believer).toBeNull();
    expect(conAsignacion.days[0]).toBe(tramo.days[0]);
  });

  it('vaciar una fase quita a quien estaba', () => {
    const puesta = withAssignment(tramo, {
      date: '2026-08-15',
      patternId: 'p1',
      position: 0,
      believerId: 'b1',
      believerName: 'Juan Carlos',
    });

    const vaciada = withAssignment(puesta, {
      date: '2026-08-15',
      patternId: 'p1',
      position: 0,
      believerId: null,
    });

    expect(vaciada.days[1]?.meetings[0]?.slots[0]?.believer).toBeNull();
  });

  it('no toca la reunión de otra sede aunque sea el mismo día', () => {
    const otra = withAssignment(tramo, {
      date: '2026-08-15',
      patternId: 'otro-patron',
      position: 0,
      believerId: 'b1',
      believerName: 'Nadie',
    });

    expect(otra.days[1]?.meetings[0]?.slots[0]?.believer).toBeNull();
  });

  it('reconoce lo que es un tramo y lo que no', () => {
    expect(isCalendarRange(tramo)).toBe(true);
    expect(isCalendarRange({ people: [] })).toBe(false);
    expect(isCalendarRange(null)).toBe(false);
  });
});
