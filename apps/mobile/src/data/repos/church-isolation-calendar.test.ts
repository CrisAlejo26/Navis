import { isolationSuite, rejectedOrUnchanged } from '../test-support/church-isolation-suite';
import { deleteCalendar, deleteCongregation } from './calendar-repo';
import { deletePattern, listPatterns, createPattern } from './calendar-settings';
import { deleteMeeting, createMeeting, assignSlot, setMeetingSlots } from './calendar-assignments';
import { ISOLATION_DAY } from '../test-support/seed-two-churches';

const suite = isolationSuite();
// B1/B4/B5: el id ajeno no basta para borrar, tampoco sus descendientes.
it.each(['calendar', 'congregation', 'pattern', 'meeting'] as const)(
    'B1/B4/B5: borrar %s no toca Sur',
    async (kind) => {
        const { north, south } = suite.churches();
        const actions = {
            calendar: () => deleteCalendar(north.churchId, south.calendarId),
            congregation: () => deleteCongregation(north.churchId, south.congregationId),
            pattern: () => deletePattern(south.patternId, north.churchId),
            meeting: () => deleteMeeting(south.meetingId, north.churchId),
        };
        const tables = {
            calendar: 'calendars',
            congregation: 'congregations',
            pattern: 'meeting_patterns',
            meeting: 'meetings',
        };
        await rejectedOrUnchanged(actions[kind], () =>
            suite.db().adapter.getAllAsync(`SELECT * FROM ${tables[kind]} ORDER BY id`),
        );
    },
);
it('B4: listar patrones con un calendario ajeno no revela Sur', async () => {
    const { north, south } = suite.churches();
    expect(await listPatterns(south.calendarId, north.churchId)).toEqual([]);
});
// C4: comprobar cada referencia por separado evita falsos positivos.
it.each(['pattern', 'meeting'] as const)('C4: %s rechaza calendario ajeno', async (kind) => {
    const { north, south } = suite.churches();
    const input = {
        name: 'Cruce',
        congregationId: north.congregationId,
        startTime: '23:59',
        phases: [{ name: 'Fase' }],
    };
    const action =
        kind === 'pattern'
            ? createPattern(north.churchId, south.calendarId, { ...input, weekday: 1 })
            : createMeeting(north.churchId, south.calendarId, { ...input, date: ISOLATION_DAY });
    await expect(action).rejects.toThrow();
});
it.each(['pattern', 'meeting'] as const)('C4: %s rechaza sede ajena', async (kind) => {
    const { north, south } = suite.churches();
    const input = {
        name: 'Cruce',
        congregationId: south.congregationId,
        startTime: '23:59',
        phases: [{ name: 'Fase' }],
    };
    const action =
        kind === 'pattern'
            ? createPattern(north.churchId, north.calendarId, { ...input, weekday: 1 })
            : createMeeting(north.churchId, north.calendarId, { ...input, date: ISOLATION_DAY });
    await expect(action).rejects.toThrow();
});
// B6: los helpers por fase dependen de que TODO llamador valide sus padres.
it('B6: assignSlot no modifica una fase de Sur desde Norte', async () => {
    const { north, south } = suite.churches();
    await rejectedOrUnchanged(
        () =>
            assignSlot(north.churchId, {
                meetingId: south.meetingId,
                date: ISOLATION_DAY,
                position: 0,
                believerIds: [],
                note: 'Intrusión',
            }),
        () => suite.db().adapter.getAllAsync('SELECT * FROM meeting_slots ORDER BY id'),
    );
});
it('B6: setMeetingSlots rechaza una persona de Sur', async () => {
    const { north, south } = suite.churches();
    await expect(
        setMeetingSlots(north.churchId, {
            id: north.meetingId,
            slots: [{ name: 'Cruce', believerIds: [south.believerId] }],
        }),
    ).rejects.toThrow();
});
