import { useDreamsExport } from '@navis/api-client';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { ExportSheet } from '@/components/export/export-sheet';
import { api } from '@/lib/api';
import { useEmotionLabel } from '@/lib/dreams/emotion-label';
import { useDreamExportColumns } from '@/lib/dreams/export-columns';
import type { DreamsScreen } from '@/lib/dreams/use-dreams-screen';
import { buildDocument } from '@/lib/export/document';
import { formatDay } from '@/lib/format';

/**
 * Exportar el listado de sueños (RFC 0009 §7.1).
 *
 * Sin nombre de iglesia, como en profecías: un sueño es de quien lo sueña
 * (RFC 0005 D1).
 */
export function DreamsExportDialog({
    open,
    onClose,
    screen,
}: {
    open: boolean;
    onClose: () => void;
    screen: Pick<DreamsScreen, 'query' | 'emotions'>;
}) {
    const { t } = useTranslation();
    const columns = useDreamExportColumns();
    const emotionLabel = useEmotionLabel();
    const query = screen.query;

    const { data, isFetching } = useDreamsExport(
        api,
        {
            search: query.search,
            state: query.state,
            emotion: query.emotion,
            from: query.from,
            to: query.to,
            sort: query.sort,
            order: query.order,
        },
        open,
    );

    const doc = useMemo(() => {
        if (!data) return null;

        const label = t('dreams.title');
        const emociones = (query.emotion ?? [])
            .map((id) => screen.emotions.find((one) => one.id === id))
            .filter((one) => one !== undefined)
            .map(emotionLabel);

        const partes = [
            t('export.rows', { count: data.returned, total: data.total }),
            query.search ? `${t('dreams.search')}: ${query.search}` : '',
            query.state && query.state.length > 0
                ? `${t('export.state')}: ${query.state.map((one) => t(`dreams.state.${one}`)).join(', ')}`
                : '',
            emociones.length > 0 ? `${t('dreams.columns.emotions')}: ${emociones.join(', ')}` : '',
            query.from || query.to
                ? [query.from, query.to]
                      .filter((day): day is string => Boolean(day))
                      .map((day) => formatDay(day))
                      .join(' – ')
                : '',
        ].filter(Boolean);

        return buildDocument({
            label,
            title: label,
            subtitle: partes.join(' · '),
            columns,
            rows: data.rows,
        });
    }, [data, columns, emotionLabel, query, screen.emotions, t]);

    return (
        <ExportSheet
            open={open}
            onClose={onClose}
            doc={doc}
            total={data?.total ?? 0}
            truncated={data?.truncated ?? false}
            isLoading={isFetching && !data}
        />
    );
}
