import {
    TABLE_OPERATORS_BY_KIND,
    isTableFilterValue,
    type TableColumnKind,
    type TableFilter,
    type TableOperator,
} from '@navis/shared';

/** El operador con el que se abre el filtro de una columna: el primero de su tipo. */
export function defaultOperator(kind: TableColumnKind): TableOperator {
    return TABLE_OPERATORS_BY_KIND[kind][0];
}

/** Los operadores que no llevan valor: basta con elegirlos. */
export function needsValue(operator: TableOperator): boolean {
    return operator !== 'isEmpty' && operator !== 'isNotEmpty';
}

/**
 * Convierte lo que hay en el formulario en un filtro **o en nada**: mientras el
 * valor esté a medias (un texto vacío, un rango sin extremos) no hay filtro, y
 * así una condición recién elegida no vacía la tabla antes de tiempo.
 */
export function toFilter(
    columnId: string,
    operator: TableOperator,
    value: unknown,
): TableFilter | null {
    if (!needsValue(operator)) return { columnId, operator };
    return isTableFilterValue(operator, value) ? { columnId, operator, value } : null;
}

const pad = (n: number) => String(n).padStart(2, '0');
const isoDay = (date: Date) =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const DATE_PRESETS = ['today', 'last7', 'thisMonth', 'thisYear'] as const;
export type DatePreset = (typeof DATE_PRESETS)[number];

/** El rango de un atajo de fechas, con los días del calendario **locales** (no UTC: CLAUDE.md, `iso-day`). */
export function datePresetRange(
    preset: DatePreset,
    now: Date = new Date(),
): { from: string; to: string } {
    const to = isoDay(now);
    if (preset === 'today') return { from: to, to };
    if (preset === 'last7') {
        const start = new Date(now);
        start.setDate(start.getDate() - 6);
        return { from: isoDay(start), to };
    }
    if (preset === 'thisMonth')
        return { from: isoDay(new Date(now.getFullYear(), now.getMonth(), 1)), to };
    return { from: isoDay(new Date(now.getFullYear(), 0, 1)), to };
}
