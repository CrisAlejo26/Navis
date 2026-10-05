import type { CustomTableColumn, CustomTableRow } from '@navis/shared';
import { getLocale, i18n } from '@/lib/i18n';

export function formatCell(column: CustomTableColumn, value: unknown): string {
    if (value == null || value === '') return '—';
    if (column.type === 'password') return '••••••';
    if (column.type === 'date' && typeof value === 'string') {
        const date = new Date(value.length === 10 ? value + 'T12:00:00Z' : value);
        if (Number.isFinite(date.getTime()))
            return new Intl.DateTimeFormat(getLocale(), {
                dateStyle: 'medium',
                ...(column.config?.includeTime ? { timeStyle: 'short' } : { timeZone: 'UTC' }),
            }).format(date);
    }
    if (column.type === 'checkbox' && typeof value === 'boolean')
        return i18n.t(value ? 'common.yes' : 'common.no');
    if ((column.type === 'number' || column.type === 'currency') && typeof value === 'number')
        return new Intl.NumberFormat(getLocale(), {
            maximumFractionDigits: column.config?.decimals ?? 2,
            ...(column.type === 'currency'
                ? { style: 'currency', currency: column.config?.currency ?? 'EUR' }
                : {}),
        }).format(value);
    if (column.type === 'single_select' && typeof value === 'string')
        return column.options?.find((one) => one.value === value)?.label ?? value;
    if (Array.isArray(value))
        return value
            .map((one: unknown) =>
                typeof one === 'string'
                    ? (column.options?.find((option) => option.value === one)?.label ?? one)
                    : '',
            )
            .join(' · ');
    return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
        ? String(value)
        : i18n.t('tables.mobile.incompatible');
}
export function rowTitle(columns: CustomTableColumn[], row: CustomTableRow): string {
    const column = columns.find((one) => one.type !== 'password');
    return column ? formatCell(column, row.data[column.key]) : row.id.slice(0, 8);
}
export function columnWidth(column: CustomTableColumn): number {
    return column.type === 'checkbox'
        ? 72
        : ['number', 'currency'].includes(column.type)
          ? 112
          : column.type === 'date'
            ? 144
            : 180;
}
