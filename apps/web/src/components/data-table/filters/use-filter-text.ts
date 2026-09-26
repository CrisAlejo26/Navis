import type { TableFilter } from '@navis/shared';
import type { RowData as TableRowData } from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';

import { useOperatorLabels } from '@/components/data-table/filters/use-operator-labels';
import type { DataTableColumn } from '@/lib/data-table/columns';
import { formatDay } from '@/lib/format';

/** Solo texto y números se escriben tal cual; cualquier otra cosa no tiene frase. */
const plain = (value: unknown): string =>
    typeof value === 'string' || typeof value === 'number' ? String(value) : '…';

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

/**
 * Un filtro dicho en una frase corta, para los chips: «Nivel mayor que 1»,
 * «Tipo es uno de De serie», «Fecha entre 1 sep 2026 – 30 sep 2026».
 */
export function useFilterText() {
    const { t } = useTranslation();
    const operators = useOperatorLabels();

    return function filterText<TItem extends TableRowData>(
        filter: TableFilter,
        column: DataTableColumn<TItem>,
    ): string {
        const head = `${column.label} ${operators[filter.operator]}`;
        const { value } = filter;

        if (typeof value === 'boolean') {
            return `${head} ${value ? t('dataTable.filters.yes') : t('dataTable.filters.no')}`;
        }
        if (Array.isArray(value)) {
            const names = (value as unknown[]).map((one) => {
                const option = column.options?.find((candidate) => candidate.value === one);
                return option?.label ?? plain(one);
            });
            return `${head} ${names.join(', ')}`;
        }
        if (isRecord(value)) {
            const { min, max, from, to } = value;
            const isDate = column.kind === 'date';
            const low = isDate && typeof from === 'string' ? formatDay(from) : min;
            const high = isDate && typeof to === 'string' ? formatDay(to) : max;
            const parts = [low, high].map((one) => plain(one));
            return `${head} ${parts.join(' – ')}`;
        }
        if (typeof value === 'string' && column.kind === 'date') {
            return `${head} ${formatDay(value)}`;
        }
        return value === undefined ? head : `${head} ${plain(value)}`;
    };
}
