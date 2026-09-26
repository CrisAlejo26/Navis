import { DREAM_STATES, type DreamListItem, type EmotionWithCount } from '@navis/shared';
import { Mic } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { DreamActions } from '@/components/dreams/dream-actions';
import { EmotionChip } from '@/components/dreams/emotion-chip';
import { DreamStateBadge } from '@/components/dreams/state-badge';
import type { DataTableColumn } from '@/lib/data-table/columns';
import { useEmotionLabel } from '@/lib/dreams/emotion-label';
import { formatDay, formatWeekday } from '@/lib/format';

/** Cuántas emociones caben en una fila antes de que la fila deje de leerse. */
const MAX_CHIPS = 3;

interface Handlers {
    emotions: readonly EmotionWithCount[];
    onEdit: (dream: DreamListItem) => void;
    onDelete: (dream: DreamListItem) => void;
}

/**
 * Las columnas de la tabla de sueños, con lo mismo que pintaba la fila de antes.
 *
 * La API filtra por estado, emoción y tramo de noches, y ordena por **una** de
 * noche, título o cuándo se cumplió; así se declara. «Cumplido» empieza oculta:
 * es el único orden que la API ofrece y que la tabla de antes no enseñaba.
 * `onEdit` y `onDelete` tienen que ser estables (un `setState`).
 */
export function useDreamColumns({
    emotions,
    onEdit,
    onDelete,
}: Handlers): DataTableColumn<DreamListItem>[] {
    const { t } = useTranslation();
    const emotionLabel = useEmotionLabel();

    return useMemo(() => {
        // Solo salen las que se han usado alguna vez: filtrar por una que no lleva
        // ningún sueño es un camino que no lleva a nada (RFC 0005 §7.5).
        const emotionOptions = emotions
            .filter((emotion) => emotion.count > 0)
            .map((emotion) => ({
                value: emotion.id,
                label: emotionLabel(emotion),
                accent: emotion.accent,
            }));
        const stateLabels = {
            apuntado: t('dreams.state.apuntado'),
            estudio: t('dreams.state.estudio'),
            cumplido: t('dreams.state.cumplido'),
        };

        return [
            {
                id: 'dreamed',
                kind: 'date',
                label: t('dreams.columns.dreamed'),
                // `w-px` con el contenido sin partir: la columna se encoge a lo que
                // ocupa la fecha en vez de repartirse el ancho a partes iguales.
                className: 'w-px whitespace-nowrap',
                hideable: false,
                filterable: true,
                operators: ['between'],
                description: t('dreams.filterDreamedHelp'),
                value: (dream) => dream.dreamedAt,
                cell: (dream) => (
                    <>
                        {/* La noche primero y en grande: un sueño se busca por «aquella
                        noche», no por el título —que además puede no tener—. */}
                        <span className="block text-[11px] text-muted-foreground uppercase">
                            {formatWeekday(new Date(`${dream.dreamedAt}T00:00:00Z`).getUTCDay())}
                        </span>
                        <span className="text-sm font-medium block tabular-nums">
                            {formatDay(dream.dreamedAt)}
                        </span>
                    </>
                ),
            },
            {
                id: 'title',
                kind: 'text',
                label: t('dreams.columns.dream'),
                hideable: false,
                value: (dream) => dream.title ?? '',
                cell: (dream) => (
                    <>
                        <Link
                            to={`/dreams/${dream.id}`}
                            className="max-w-xs font-medium block truncate text-[15px] hover:underline"
                        >
                            {dream.title ?? t('dreams.untitled')}
                        </Link>
                        <span className="text-xs max-w-xs block truncate text-muted-foreground">
                            {dream.excerpt}
                        </span>
                    </>
                ),
            },
            {
                id: 'emotions',
                kind: 'select',
                label: t('dreams.columns.emotions'),
                showFrom: 'lg',
                sortable: false,
                filterable: true,
                facet: true,
                operators: ['in'],
                description: t('dreams.filterEmotionHelp'),
                options: emotionOptions,
                value: (dream) => dream.emotions.map((emotion) => emotionLabel(emotion)).join(', '),
                // La columna de color del listado (D20).
                cell: (dream) => (
                    <span className="gap-1 flex flex-wrap">
                        {dream.emotions.slice(0, MAX_CHIPS).map((emotion) => (
                            <EmotionChip key={emotion.id} emotion={emotion} size="sm" />
                        ))}
                        {dream.emotions.length > MAX_CHIPS && (
                            <span className="self-center text-[10px] text-muted-foreground">
                                +{dream.emotions.length - MAX_CHIPS}
                            </span>
                        )}
                    </span>
                ),
            },
            {
                id: 'state',
                kind: 'select',
                label: t('dreams.columns.state'),
                sortable: false,
                filterable: true,
                facet: true,
                operators: ['in'],
                description: t('dreams.filterStateHelp'),
                options: DREAM_STATES.map((state) => ({ value: state, label: stateLabels[state] })),
                value: (dream) => dream.state,
                cell: (dream) => (
                    <span className="gap-2 flex items-center">
                        <DreamStateBadge state={dream.state} />
                        {dream.audiosCount > 0 && (
                            <Mic
                                size={13}
                                aria-label={t('common.audio.title')}
                                className="text-muted-foreground"
                            />
                        )}
                    </span>
                ),
            },
            {
                id: 'fulfilled',
                kind: 'date',
                label: t('dreams.columns.fulfilled'),
                defaultVisible: false,
                className: 'whitespace-nowrap text-muted-foreground tabular-nums',
                value: (dream) => dream.fulfilledAt,
                cell: (dream) => (dream.fulfilledAt ? formatDay(dream.fulfilledAt) : '—'),
            },
            {
                id: 'actions',
                kind: 'text',
                label: t('common.actions'),
                header: <span className="sr-only">{t('common.actions')}</span>,
                sortable: false,
                hideable: false,
                align: 'right',
                cell: (dream) => (
                    <DreamActions
                        title={dream.title ?? undefined}
                        onEdit={() => {
                            onEdit(dream);
                        }}
                        onDelete={() => {
                            onDelete(dream);
                        }}
                    />
                ),
            },
        ] satisfies DataTableColumn<DreamListItem>[];
    }, [t, emotions, emotionLabel, onEdit, onDelete]);
}
