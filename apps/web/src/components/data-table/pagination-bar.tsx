import { PAGE_SIZES, isPageSize, type PageSize } from '@navis/shared';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { IconAction } from '@/components/ui/icon-action';
import { Select } from '@/components/ui/select';

interface PaginationBarProps {
    page: number;
    limit: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: PageSize) => void;
}

/**
 * Pie de tabla: tamaño de página y navegación. El «cuántos hay» vive en la
 * línea de estado de arriba, no aquí: decirlo dos veces no ayuda.
 *
 * Primera y última página solo de `sm` para arriba: en un teléfono no caben
 * cuatro botones con un objetivo táctil decente (Regla 5 §4).
 */
export function PaginationBar({
    page,
    limit,
    totalPages,
    onPageChange,
    onLimitChange,
}: PaginationBarProps) {
    const { t } = useTranslation();
    const atStart = page <= 1;
    const atEnd = page >= totalPages;

    const step = (
        label: string,
        target: number,
        disabled: boolean,
        icon: React.ReactNode,
        extra = '',
    ) => (
        <IconAction
            tone="primary"
            className={extra}
            disabled={disabled}
            aria-label={label}
            onClick={() => {
                onPageChange(target);
            }}
        >
            {icon}
        </IconAction>
    );

    return (
        <div className="gap-3 sm:flex-row sm:items-center sm:justify-between flex flex-col">
            <label className="gap-2 text-xs flex items-center text-muted-foreground">
                {t('dataTable.rowsPerPage')}
                <Select
                    size="sm"
                    value={limit}
                    aria-label={t('dataTable.rowsPerPage')}
                    onChange={(event) => {
                        const size = Number(event.target.value);
                        if (isPageSize(size)) onLimitChange(size);
                    }}
                >
                    {PAGE_SIZES.map((size) => (
                        <option key={size} value={size}>
                            {size}
                        </option>
                    ))}
                </Select>
            </label>

            <nav
                aria-label={t('dataTable.pageOf', { page, totalPages })}
                className="flex items-center"
            >
                {step(
                    t('dataTable.firstPage'),
                    1,
                    atStart,
                    <ChevronsLeft size={16} aria-hidden />,
                    'hidden sm:inline-flex',
                )}
                {step(
                    t('dataTable.previousPage'),
                    page - 1,
                    atStart,
                    <ChevronLeft size={16} aria-hidden />,
                )}
                <span className="px-3 text-xs text-muted-foreground tabular-nums">
                    {t('dataTable.pageOf', { page, totalPages })}
                </span>
                {step(
                    t('dataTable.nextPage'),
                    page + 1,
                    atEnd,
                    <ChevronRight size={16} aria-hidden />,
                )}
                {step(
                    t('dataTable.lastPage'),
                    totalPages,
                    atEnd,
                    <ChevronsRight size={16} aria-hidden />,
                    'hidden sm:inline-flex',
                )}
            </nav>
        </div>
    );
}
