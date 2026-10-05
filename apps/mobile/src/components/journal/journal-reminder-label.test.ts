import { journalReminderLabel } from './journal-reminder-label';

it('distingue hoy y mañana usando días locales, también al cambiar de año', () => {
    const now = new Date(2026, 11, 31, 12);
    expect(journalReminderLabel(new Date(2026, 11, 31, 19, 30).toISOString(), now)).toMatch(
        /^Hoy, .*19:30/,
    );
    expect(journalReminderLabel(new Date(2027, 0, 1, 9, 0).toISOString(), now)).toMatch(
        /^Mañana, .*09:00/,
    );
    expect(journalReminderLabel(new Date(2027, 0, 2, 9).toISOString(), now)).not.toMatch(
        /Hoy|Mañana/,
    );
});
