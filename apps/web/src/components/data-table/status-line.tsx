import type { TableSort } from '@navis/shared';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface StatusLineProps {
    from: number;
    to: number;
    total: number;
    sorts: readonly TableSort[];
    /** Etiqueta traducida de cada columna, por su id. */
    labels: ReadonlyMap<string, string>;
    /** Vuelve al orden por defecto. Sin él, el criterio no se puede quitar desde aquí. */
    onClearSort?: () => void;
    /** Cuántas columnas ocultas hay, y cómo volver a verlas todas. */
    hiddenColumns?: number;
    onShowColumns?: () => void;
}

/**
 * La bitácora de la tabla: qué se está viendo y bajo qué criterio, en una línea.
 *
 * Es lo que evita que una tabla ordenada o filtrada parezca idéntica a la de
 * siempre (el error clásico de las tablas: creer que faltan datos). Cada
 * fragmento que se puede deshacer lleva su propia ×; los que se irán sumando
 * (filtros, columnas ocultas) entran como un fragmento más.
 */
export function StatusLine({
    from,
    to,
    total,
    sorts,
    labels,
    onClearSort,
    hiddenColumns = 0,
    onShowColumns,
}: StatusLineProps) {
    const { t } = useTranslation();
    const criteria = sorts
        .map(
            (sort) =>
                `${labels.get(sort.columnId) ?? sort.columnId} ${sort.dir === 'asc' ? '↑' : '↓'}`,
        )
        .join(', ');

    return (
        <div className="gap-x-3 gap-y-1 text-xs flex flex-wrap items-center text-muted-foreground">
            <p aria-live="polite" className="font-medium text-foreground tabular-nums">
                <span aria-hidden>{t('dataTable.showing', { from, to, total })}</span>
                <span className="sr-only">{t('dataTable.resultsTotal', { total })}</span>
            </p>

            {sorts.length > 0 && (
                <p className="gap-1 inline-flex items-center">
                    <span>{t('dataTable.sortStatus', { criteria })}</span>
                    {onClearSort && (
                        <button
                            type="button"
                            aria-label={t('dataTable.clearSort')}
                            title={t('dataTable.clearSort')}
                            onClick={onClearSort}
                            className="h-6 w-6 inline-flex cursor-pointer items-center justify-center rounded-sm hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        >
                            <X size={12} aria-hidden />
                        </button>
                    )}
                </p>
            )}
            {hiddenColumns > 0 && onShowColumns && (
                <p className="gap-1 inline-flex items-center">
                    <span>{t('dataTable.columns.hiddenStatus', { count: hiddenColumns })}</span>
                    <button
                        type="button"
                        aria-label={t('dataTable.columns.showAll')}
                        title={t('dataTable.columns.showAll')}
                        onClick={onShowColumns}
                        className="h-6 w-6 inline-flex cursor-pointer items-center justify-center rounded-sm hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                        <X size={12} aria-hidden />
                    </button>
                </p>
            )}
        </div>
    );
}
