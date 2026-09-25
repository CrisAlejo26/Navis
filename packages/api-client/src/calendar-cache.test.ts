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
                        { id: null, name: 'Introducción', position: 0, note: null, believers: [] },
                        { id: null, name: 'Enseñanza', position: 1, note: null, believers: [] },
                    ],
                },
            ],
        },
    ],
};

describe('parcheo optimista del calendario', () => {
    it('pone a las personas en su fase, en orden, sin tocar el resto del tramo', () => {
        const conAsignacion = withAssignment(tramo, {
            date: '2026-08-15',
            patternId: 'p1',
            position: 1,
            believerIds: ['b2', 'b1'],
            believers: [
                { id: 'b1', name: 'Luis Fernando' },
                { id: 'b2', name: 'Ana' },
            ],
        });

        const reunion = conAsignacion.days[1]?.meetings[0];
        expect(reunion?.slots[1]?.believers).toEqual([
            { id: 'b2', name: 'Ana' },
            { id: 'b1', name: 'Luis Fernando' },
        ]);
        expect(reunion?.slots[0]?.believers).toEqual([]);
        expect(conAsignacion.days[0]).toBe(tramo.days[0]);
    });

    it('quien ya estaba en la fase conserva su nombre al añadir a otro', () => {
        const puesta = withAssignment(tramo, {
            date: '2026-08-15',
            patternId: 'p1',
            position: 0,
            believerIds: ['b1'],
            believers: [{ id: 'b1', name: 'Juan Carlos' }],
        });

        const con2 = withAssignment(puesta, {
            date: '2026-08-15',
            patternId: 'p1',
            position: 0,
            believerIds: ['b1', 'b2'],
            believers: [{ id: 'b2', name: 'Ana' }],
        });

        expect(con2.days[1]?.meetings[0]?.slots[0]?.believers).toEqual([
            { id: 'b1', name: 'Juan Carlos' },
            { id: 'b2', name: 'Ana' },
        ]);
    });

    it('vaciar una fase quita a todos los que estaban', () => {
        const puesta = withAssignment(tramo, {
            date: '2026-08-15',
            patternId: 'p1',
            position: 0,
            believerIds: ['b1', 'b2'],
        });

        const vaciada = withAssignment(puesta, {
            date: '2026-08-15',
            patternId: 'p1',
            position: 0,
            believerIds: [],
        });

        expect(vaciada.days[1]?.meetings[0]?.slots[0]?.believers).toEqual([]);
    });

    it('no toca la reunión de otra sede aunque sea el mismo día', () => {
        const otra = withAssignment(tramo, {
            date: '2026-08-15',
            patternId: 'otro-patron',
            position: 0,
            believerIds: ['b1'],
            believers: [{ id: 'b1', name: 'Nadie' }],
        });

        expect(otra.days[1]?.meetings[0]?.slots[0]?.believers).toEqual([]);
    });

    it('reconoce lo que es un tramo y lo que no', () => {
        expect(isCalendarRange(tramo)).toBe(true);
        expect(isCalendarRange({ people: [] })).toBe(false);
        expect(isCalendarRange(null)).toBe(false);
    });
});
