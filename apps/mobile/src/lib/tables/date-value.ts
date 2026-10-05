export function localDateParts(value: string): { day: string; time: string } {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return { day: '', time: '' };
    const pad = (number: number) => String(number).padStart(2, '0');
    return {
        day: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
        time: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
    };
}
export function combineLocalDate(day: string, time: string): string {
    return new Date(`${day}T${time}:00`).toISOString();
}
