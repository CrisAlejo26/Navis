/** La zona horaria del dispositivo: en local, es la de quien usa la app. */
export function deviceTimezone(): string {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Madrid';
    } catch {
        return 'Europe/Madrid';
    }
}
