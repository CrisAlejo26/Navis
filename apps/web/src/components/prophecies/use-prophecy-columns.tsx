import { PROPHECY_STATES, type ProphecyListItem } from '@navis/shared';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { ProphecyActions } from '@/components/prophecies/prophecy-actions';
import { StateBadge } from '@/components/prophecies/state-badge';
import type { DataTableColumn } from '@/lib/data-table/columns';
import { formatDay, formatNumber } from '@/lib/format';

interface Handlers {
    onEdit: (prophecy: ProphecyListItem) => void;
    onFulfill: (prophecy: ProphecyListItem) => void;
    onDelete: (prophecy: ProphecyListItem) => void;
}

/**
 * Las columnas de la tabla de profecías, con lo mismo que pintaba la fila de antes.
 *
 * La API filtra por estado y por un tramo de fechas de recepción, y ordena por
 * **una** de recepción, título, «cuánto espera» o «lo último que se movió»; así se
 * declara. Esta última empieza oculta: es un orden que la API ofrece y la tabla de
 * antes no enseñaba. Los tres manejadores tienen que ser estables (un `setState`).
 */
export function useProphecyColumns({
    onEdit,
    onFulfill,
    onDelete,
}: Handlers): DataTableColumn<ProphecyListItem>[] {
    const { t } = useTranslation();

    return useMemo(
        () =>
            [
                {
                    id: 'title',
                    kind: 'text',
                    label: t('prophecies.columns.title'),
                    hideable: false,
                    value: (prophecy) => prophecy.title,
                    cell: (prophecy) => (
                        <>
                            <Link
                                to={`/prophecies/${prophecy.id}`}
                                className="max-w-xs font-medium block truncate text-[15px] hover:underline"
                            >
                                {prophecy.title}
                            </Link>
                            <span className="text-xs max-w-xs block truncate text-muted-foreground">
                                {prophecy.excerpt}
                            </span>
                        </>
                    ),
                },
                {
                    id: 'received',
                    kind: 'date',
                    label: t('prophecies.columns.received'),
                    className: 'text-sm tabular-nums',
                    filterable: true,
                    operators: ['between'],
                    description: t('prophecies.filterReceivedHelp'),
                    value: (prophecy) => prophecy.receivedAt,
                    cell: (prophecy) => formatDay(prophecy.receivedAt),
                },
                {
                    id: 'state',
                    kind: 'select',
                    label: t('prophecies.columns.state'),
                    sortable: false,
                    filterable: true,
                    facet: true,
                    operators: ['in'],
                    description: t('prophecies.filterStateHelp'),
                    options: PROPHECY_STATES.map((state) => ({
                        value: state,
                        label: t(`prophecies.state.${state}`),
                    })),
                    value: (prophecy) => prophecy.state,
                    cell: (prophecy) => <StateBadge state={prophecy.state} />,
                },
                {
                    id: 'fulfillments',
                    kind: 'number',
                    label: t('prophecies.columns.fulfillments'),
                    showFrom: 'lg',
                    sortable: false,
                    className: 'text-sm text-muted-foreground tabular-nums',
                    value: (prophecy) => prophecy.fulfillmentsCount,
                    cell: (prophecy) =>
                        prophecy.fulfillmentsCount > 0
                            ? formatNumber(prophecy.fulfillmentsCount)
                            : '—',
                },
                {
                    // El identificador es el del orden de la API: «cuánto espera» se ordena por
                    // el día en que se cumplió.
                    id: 'fulfilled',
                    kind: 'number',
                    label: t('prophecies.columns.waiting'),
                    className: 'text-sm text-muted-foreground tabular-nums',
                    value: (prophecy) => prophecy.waitingDays,
                    cell: (prophecy) =>
                        prophecy.fulfilledAt
                            ? t('prophecies.waitedFor', {
                                  days: formatNumber(prophecy.waitingDays),
                              })
                            : t('prophecies.waitingFor', {
                                  days: formatNumber(prophecy.waitingDays),
                              }),
                },
                {
                    id: 'lastMovement',
                    kind: 'date',
                    label: t('prophecies.columns.lastMovement'),
                    defaultVisible: false,
                    className: 'whitespace-nowrap text-sm text-muted-foreground tabular-nums',
                    value: (prophecy) => prophecy.lastFulfillmentAt,
                    cell: (prophecy) =>
                        prophecy.lastFulfillmentAt ? formatDay(prophecy.lastFulfillmentAt) : '—',
                },
                {
                    id: 'actions',
                    kind: 'text',
                    label: t('common.actions'),
                    header: <span className="sr-only">{t('common.actions')}</span>,
                    sortable: false,
                    hideable: false,
                    align: 'right',
                    cell: (prophecy) => (
                        <ProphecyActions
                            onEdit={() => {
                                onEdit(prophecy);
                            }}
                            onFulfill={() => {
                                onFulfill(prophecy);
                            }}
                            onDelete={() => {
                                onDelete(prophecy);
                            }}
                        />
                    ),
                },
            ] satisfies DataTableColumn<ProphecyListItem>[],
        [t, onEdit, onFulfill, onDelete],
    );
}
