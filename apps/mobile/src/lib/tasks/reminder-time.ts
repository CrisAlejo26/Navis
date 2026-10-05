/** Church wall clock → instant. Never inherit the device's time zone. */
export function reminderParts(instant: string, timezone: string) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    }).formatToParts(new Date(instant));
    const part = (name: string) => parts.find((p) => p.type === name)?.value ?? '';
    return {
        date: `${part('year')}-${part('month')}-${part('day')}`,
        time: `${part('hour')}:${part('minute')}`,
    };
}
export function reminderInstant(date: string, time: string, timezone: string): string {
    const wall = Date.parse(`${date}T${time}:00Z`);
    if (!Number.isFinite(wall)) throw new Error('invalid-reminder');
    let instant = wall;
    for (let attempt = 0; attempt < 3; attempt++) {
        const local = reminderParts(new Date(instant).toISOString(), timezone);
        const difference = wall - Date.parse(`${local.date}T${local.time}:00Z`);
        if (difference === 0) return new Date(instant).toISOString();
        instant += difference;
    }
    throw new Error('invalid-reminder');
}
