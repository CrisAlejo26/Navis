import type { TeachingListItem } from '@navis/shared';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { TeachingActions } from '@/components/teachings/teaching-actions';
import { TeachingChecklistBadge } from '@/components/teachings/teaching-checklist-badge';
import type { DataTableColumn } from '@/lib/data-table/columns';
import { formatDay } from '@/lib/format';

interface Handlers {
    onEdit: (teaching: TeachingListItem) => void;
    onDelete: (teaching: TeachingListItem) => void;
}

/**
 * Las columnas de la tabla de enseñanzas, con lo mismo que pintaba la fila de antes.
 * La API ordena por título o por fecha de recepción, y no filtra. `onEdit` y
 * `onDelete` tienen que ser estables (un `setState`).
 */
export function useTeachingColumns({
    onEdit,
    onDelete,
}: Handlers): DataTableColumn<TeachingListItem>[] {
    const { t } = useTranslation();

    return useMemo(
        () =>
            [
                {
                    id: 'title',
                    kind: 'text',
                    label: t('teachings.columns.title'),
                    hideable: false,
                    value: (teaching) => teaching.title,
                    cell: (teaching) => (
                        <>
                            <Link
                                to={`/teachings/${teaching.id}`}
                                className="max-w-xs font-medium block truncate text-[15px] hover:underline"
                            >
                                {teaching.title}
                            </Link>
                            <span className="text-xs max-w-xs block truncate text-muted-foreground">
                                {teaching.excerpt}
                            </span>
                        </>
                    ),
                },
                {
                    id: 'received',
                    kind: 'date',
                    label: t('teachings.columns.received'),
                    className: 'text-sm tabular-nums',
                    value: (teaching) => teaching.receivedAt,
                    cell: (teaching) => formatDay(teaching.receivedAt),
                },
                {
                    id: 'checklist',
                    kind: 'text',
                    label: t('teachings.columns.checklist'),
                    sortable: false,
                    value: (teaching) =>
                        teaching.checklist
                            ? `${String(teaching.checklist.checked)}/${String(teaching.checklist.total)}`
                            : '',
                    cell: (teaching) => <TeachingChecklistBadge checklist={teaching.checklist} />,
                },
                {
                    id: 'actions',
                    kind: 'text',
                    label: t('common.actions'),
                    header: <span className="sr-only">{t('common.actions')}</span>,
                    sortable: false,
                    hideable: false,
                    align: 'right',
                    cell: (teaching) => (
                        <TeachingActions
                            title={teaching.title}
                            onEdit={() => {
                                onEdit(teaching);
                            }}
                            onDelete={() => {
                                onDelete(teaching);
                            }}
                        />
                    ),
                },
            ] satisfies DataTableColumn<TeachingListItem>[],
        [t, onEdit, onDelete],
    );
}
