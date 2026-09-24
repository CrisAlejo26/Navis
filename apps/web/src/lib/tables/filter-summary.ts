import type { TFunction } from 'i18next';
import type { CustomTableColumn, RowFilter } from '@navis/shared';

/** El texto corto que pinta el chip y el menú: «Contiene “x”», «Desde a hasta b»… */
export function summarizeFilter(
    filter: RowFilter,
    column: CustomTableColumn,
    t: TFunction,
): string {
    if (filter.operator === 'contains') {
        return `${t('tables.filters.opContains')} «${String(filter.value)}»`;
    }

    if (filter.operator === 'equals') {
        return filter.value ? t('common.yes') : t('common.no');
    }

    if (filter.operator === 'in') {
        const values = Array.isArray(filter.value) ? (filter.value as string[]) : [];
        const labels = (column.options ?? [])
            .filter((one) => values.includes(one.value))
            .map((one) => one.label);
        return `${t('tables.filters.opIn')} ${(labels.length > 0 ? labels : values).join(', ')}`;
    }

    // `between`: número o fecha, y cada mitad puede faltar.
    const rango = (filter.value ?? {}) as {
        from?: string;
        to?: string;
        min?: number | string;
        max?: number | string;
    };
    const desde = rango.from ?? rango.min;
    const hasta = rango.to ?? rango.max;
    const partes = [
        desde !== undefined ? `${t('tables.filters.opFrom')} ${String(desde)}` : null,
        hasta !== undefined ? `${t('tables.filters.to')} ${String(hasta)}` : null,
    ];
    return partes.filter(Boolean).join(' ');
}
