const pad = (n: number) => String(n).padStart(2, '0');
const dayOf = (date: Date): string =>
    `${String(date.getFullYear())}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/**
 * El primer día de una «ventana rápida» de los enlaces de antes (`7d`, `30d`,
 * `year`), en el día de calendario **de quien mira**. `all` y cualquier otra cosa
 * no acotan: devuelve vacío.
 *
 * Las ventanas ya no viajan a la API: son atajos de fechas del filtro de la tabla,
 * que las calcula en el navegador. Esto solo sirve para traducir un enlace viejo.
 */
export function legacyWindowStart(window: string, now: Date = new Date()): string {
    if (window === 'year') return `${String(now.getFullYear())}-01-01`;
    if (window !== '7d' && window !== '30d') return '';

    const start = new Date(now);
    start.setDate(start.getDate() - (window === '7d' ? 6 : 29));
    return dayOf(start);
}
