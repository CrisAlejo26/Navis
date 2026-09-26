import {
    believerName,
    BELIEVER_STATUSES,
    type BelieverListItem,
    type BelieverTag,
    type Congregation,
    type Gift,
    type IsoDate,
    type ListMemberships,
    type ListSummary,
    type MinistryCatalog,
} from '@navis/shared';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import {
    BelieverActions,
    type BelieverActionHandlers,
} from '@/components/believers/believer-actions';
import { BelieverPhoto } from '@/components/believers/believer-photo';
import { BelieverTagPills } from '@/components/believers/believer-tag-pills';
import { GiftTags } from '@/components/believers/gift-tags';
import { MinistryTags } from '@/components/believers/ministry-tags';
import { Sonda } from '@/components/believers/sonda';
import { StatusBadge } from '@/components/believers/status-badge';
import { ListDots } from '@/components/lists/list-dots';
import { STATUS_ACCENT } from '@/lib/believers/status-accent';
import type { DataTableColumn } from '@/lib/data-table/columns';
import { cellDay } from '@/lib/export/columns';

export interface BelieverRowHandlers {
    onNote: (believer: BelieverListItem) => void;
    onEdit: (believer: BelieverListItem) => void;
    onDelete: (believer: BelieverListItem) => void;
}

export interface BelieverColumnsContext {
    ministries: readonly MinistryCatalog[];
    lists: readonly ListSummary[];
    memberships: ListMemberships;
    congregations: readonly Congregation[];
    gifts: readonly Gift[];
    tags: readonly BelieverTag[];
    today: IsoDate;
    canManage: boolean;
    /** Estables (un `setState`). */
    handlers: BelieverRowHandlers;
}

/** Las acciones de una fila, ligadas a ella. */
export function actionsOf(
    believer: BelieverListItem,
    handlers: BelieverRowHandlers,
): BelieverActionHandlers {
    return {
        onNote: () => {
            handlers.onNote(believer);
        },
        onEdit: () => {
            handlers.onEdit(believer);
        },
        onDelete: () => {
            handlers.onDelete(believer);
        },
    };
}

/**
 * Las columnas de la tabla de creyentes: **las mismas** que pintaba la fila de
 * antes —foto, nombre con sus listas y su teléfono, estado, dones, labores,
 * etiqueta, sonda y acciones— y con el mismo ancho a partir del cual entra cada
 * una. La API filtra por estado, sede, don, etiqueta, lista y «piden atención», y
 * ordena por una sola columna.
 *
 * La sede no sale como columna (una sola sede repetiría la misma celda en cada
 * fila): existe **solo para filtrar**, y solo si hay más de una. Lo mismo la
 * lista y «en N listas o más», a la que se llega desde la portada de listas.
 */
export function useBelieverColumns(
    ctx: BelieverColumnsContext,
): DataTableColumn<BelieverListItem>[] {
    const { t } = useTranslation();
    const { ministries, lists, memberships, congregations, gifts, tags, today, canManage } = ctx;
    const { handlers } = ctx;

    return useMemo(() => {
        const activeLists = lists.filter((one) => one.isActive);
        const activeGifts = gifts.filter((one) => one.isActive);
        const activeTags = tags.filter((one) => one.isActive);

        return [
            {
                id: 'photo',
                kind: 'text',
                label: t('believers.photo'),
                header: <span className="sr-only">{t('believers.photo')}</span>,
                sortable: false,
                hideable: false,
                // `w-11` y no `w-px`: el reset pone `max-width: 100%` a las imágenes, y
                // en una celda de un píxel la foto se queda en cero de ancho.
                className: 'w-11 pr-0',
                cell: (believer) => <BelieverPhoto believer={believer} />,
            },
            {
                id: 'name',
                kind: 'text',
                label: t('believers.columnName'),
                hideable: false,
                value: (believer) => believerName(believer),
                cell: (believer) => (
                    <>
                        <span className="gap-1.5 flex items-center">
                            <Link
                                to={`/believers/${believer.id}`}
                                className="font-medium rounded-sm text-[15px] hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                            >
                                {believerName(believer)}
                            </Link>
                            {/* Quien mira una fila tiene que ver de un vistazo que ese nombre
                  está hoy en un cartel (RFC 0010 §8.7). */}
                            <ListDots lists={lists} listIds={memberships[believer.id]} />
                        </span>
                        {believer.phone && (
                            <span className="text-xs block text-muted-foreground tabular-nums">
                                {believer.phone}
                            </span>
                        )}
                    </>
                ),
            },
            {
                id: 'status',
                kind: 'select',
                label: t('believers.columnStatus'),
                filterable: true,
                facet: true,
                operators: ['in'],
                description: t('believers.filterStatusHelp'),
                options: BELIEVER_STATUSES.map((status) => ({
                    value: status,
                    label: t(`believers.status.${status}`),
                    accent: STATUS_ACCENT[status],
                })),
                value: (believer) => believer.status,
                cell: (believer) => <StatusBadge status={believer.status} />,
            },
            {
                id: 'gifts',
                kind: 'select',
                label: t('believers.columnGifts'),
                showFrom: 'lg',
                sortable: false,
                filterable: activeGifts.length > 0,
                facet: activeGifts.length > 0,
                single: true,
                operators: ['in'],
                description: t('believers.filterGiftHelp'),
                options: activeGifts.map((gift) => ({
                    value: gift.id,
                    label: gift.name,
                    accent: gift.accent,
                })),
                cell: (believer) => <GiftTags gifts={believer.gifts} max={3} />,
            },
            {
                // Las labores entran más tarde que los dones —`xl` y no `lg`—: son la
                // quinta columna de la fila y en un portátil estrecho la aprietan.
                id: 'ministries',
                kind: 'text',
                label: t('ministries.title'),
                showFrom: 'xl',
                sortable: false,
                cell: (believer) => (
                    <MinistryTags slugs={believer.ministries} catalog={ministries} max={2} />
                ),
            },
            {
                // La etiqueta ayuda a saber «quién es el que busca trabajo» de un
                // vistazo, y por eso sale antes que las labores, desde `md`.
                id: 'tag',
                kind: 'select',
                label: t('believers.columnTag'),
                showFrom: 'md',
                sortable: false,
                filterable: activeTags.length > 0,
                facet: activeTags.length > 0,
                single: true,
                operators: ['in'],
                description: t('believers.filterTagHelp'),
                options: activeTags.map((tag) => ({
                    value: tag.id,
                    label: tag.name,
                    accent: tag.accent,
                })),
                cell: (believer) => {
                    // Solo una por fila: la destacada, o la primera si no hay ninguna.
                    const one =
                        believer.tags.find((tag) => tag.id === believer.featuredTagId) ??
                        believer.tags[0];
                    return <BelieverTagPills tags={one ? [one] : []} />;
                },
            },
            {
                // La que más se ordena: «quién lleva más sin que le escriban» es la
                // pregunta de la pantalla (§6.1).
                id: 'lastNote',
                kind: 'date',
                label: t('believers.columnAlert'),
                value: (believer) => believer.lastNoteAt,
                exportCell: (believer) => cellDay(believer.lastNoteAt),
                cell: (believer, index) => (
                    <Sonda believer={believer} today={today} index={index} />
                ),
            },
            {
                id: 'attention',
                kind: 'select',
                label: t('believers.onlyAttention'),
                filterOnly: true,
                sortable: false,
                filterable: true,
                facet: true,
                operators: ['in'],
                single: true,
                description: t('believers.filterAttentionHelp'),
                options: [{ value: 'true', label: t('believers.onlyAttention') }],
                cell: () => null,
            },
            {
                id: 'congregation',
                kind: 'select',
                label: t('believers.congregation'),
                filterOnly: true,
                sortable: false,
                filterable: congregations.length > 1,
                facet: congregations.length > 1,
                single: true,
                operators: ['in'],
                description: t('believers.filterCongregationHelp'),
                options: congregations.map((one) => ({ value: one.id, label: one.name })),
                cell: () => null,
            },
            {
                // Es la vuelta del camino de la RFC 0010 D5: el filtro llena la lista
                // y, desde aquí, la lista filtra a quien está en ella.
                id: 'list',
                kind: 'select',
                label: t('lists.filterByList'),
                filterOnly: true,
                sortable: false,
                filterable: activeLists.length > 0,
                facet: activeLists.length > 0,
                single: true,
                operators: ['in'],
                description: t('believers.filterListHelp'),
                options: activeLists.map((one) => ({ value: one.id, label: one.name })),
                cell: () => null,
            },
            {
                // Sin botón propio: se llega desde la línea «7 personas están en 4
                // listas o más» de la portada de listas (RFC 0010 D36).
                id: 'inLists',
                kind: 'number',
                label: t('believers.inListsColumn'),
                filterOnly: true,
                sortable: false,
                filterable: activeLists.length > 0,
                operators: ['equals'],
                description: t('believers.filterInListsHelp'),
                cell: () => null,
            },
            {
                id: 'actions',
                kind: 'text',
                label: t('common.actions'),
                header: <span className="sr-only">{t('common.actions')}</span>,
                sortable: false,
                hideable: false,
                align: 'right',
                cell: (believer) => (
                    <BelieverActions
                        name={believerName(believer)}
                        canManage={canManage}
                        {...actionsOf(believer, handlers)}
                    />
                ),
            },
        ] satisfies DataTableColumn<BelieverListItem>[];
    }, [t, ministries, lists, memberships, congregations, gifts, tags, today, canManage, handlers]);
}
