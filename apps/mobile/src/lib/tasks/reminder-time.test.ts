import { reminderInstant, reminderParts } from './reminder-time';
describe('recordatorios en la zona de la iglesia', () => {
    it.each([
        ['2026-10-05', '09:30', 'Europe/Madrid', '2026-10-05T07:30:00.000Z'],
        ['2026-12-05', '09:30', 'Europe/Madrid', '2026-12-05T08:30:00.000Z'],
        ['2026-10-05', '09:30', 'America/Bogota', '2026-10-05T14:30:00.000Z'],
    ])(
        'convierte %s %s en %s sin usar la zona del dispositivo',
        (date, time, timezone, instant) => {
            expect(reminderInstant(date, time, timezone)).toBe(instant);
            expect(reminderParts(instant, timezone)).toEqual({ date, time });
        },
    );
    it('rechaza una hora que desaparece al adelantar el reloj', () => {
        expect(() => reminderInstant('2026-03-29', '02:30', 'Europe/Madrid')).toThrow(
            'invalid-reminder',
        );
    });
});
