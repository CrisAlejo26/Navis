import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';
import { rowDataSchema, type RowData } from '@navis/shared';
import { tablesKey, useTableContext, useTable, useTableViews } from '@/hooks/use-tables';
import { readTableRows } from '@/data/repos/table-rows-read';
import { RowForm } from './row-form';
import { RowDetail } from './row-detail';
import { AppBar } from '@/components/ui/app-bar';
import { EmptyState } from '@/components/ui/empty-state';

function initialData(text?: string): RowData {
    try {
        return text ? rowDataSchema.parse(JSON.parse(text) as unknown) : {};
    } catch {
        return {};
    }
}
export function TableRowScreen({
    id,
    rowId,
    viewId,
    initial,
}: {
    id: string;
    rowId?: string;
    viewId?: string;
    initial?: string;
}) {
    const { t } = useTranslation(),
        { context, enabled, canEditRows } = useTableContext(),
        table = useTable(id),
        views = useTableViews(id);
    const row = useQuery({
        queryKey: [...tablesKey(context), id, 'row', rowId],
        queryFn: () => readTableRows(context, id, { rowId }, 1, 1),
        enabled: enabled && Boolean(rowId),
    });
    const close = () =>
        router.canGoBack()
            ? router.back()
            : router.replace({ pathname: '/tables/[id]', params: { id } });
    if (table.isPending || views.isPending || (rowId && row.isPending))
        return (
            <View className="flex-1 bg-background">
                <AppBar title={t('tables.title')} />
                <ActivityIndicator />
            </View>
        );
    if (
        table.isError ||
        views.isError ||
        (rowId && (row.isError || !row.data?.items[0])) ||
        (!rowId && !canEditRows)
    )
        return (
            <View className="flex-1 bg-background">
                <AppBar title={t('tables.title')} />
                <EmptyState icon="alert-circle-outline" title={t('tables.notFound')} />
            </View>
        );
    const item = row.data?.items[0];
    return item ? (
        <RowDetail
            key={item.id}
            table={table.data}
            row={item}
            view={views.data?.find((one) => one.id === viewId)}
            onClose={close}
            screen
        />
    ) : (
        <RowForm table={table.data} initial={initialData(initial)} onClose={close} screen />
    );
}
