import type { TFunction } from 'i18next';
import type { RowFilter } from '@navis/shared';

import { toast } from '@/lib/toast';

/**
 * Confirmar con un aviso que el filtro se aplicó —o que se quitó— (D3). Solo
 * habla cuando el **número** de filtros cambia: afinar el valor de uno que
 * ya estaba no repite el aviso, que marearía más de lo que informa.
 */
export function announceFilterChange(
    previous: readonly RowFilter[],
    next: readonly RowFilter[],
    t: TFunction,
): void {
    if (next.length > previous.length) toast.success(t('common.filterApplied'));
    else if (next.length < previous.length) toast.info(t('common.filterCleared'));
}
