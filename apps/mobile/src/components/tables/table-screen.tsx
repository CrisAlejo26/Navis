import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';
import { useTable, useTableViews } from '@/hooks/use-tables';
import { AppBar } from '@/components/ui/app-bar';
import { EmptyState } from '@/components/ui/empty-state';
import { TableWorkspace } from './table-workspace';

export function TableScreen({ id }: { id: string }) {
    const { t } = useTranslation(),
        table = useTable(id),
        views = useTableViews(id);
    if (table.isPending || views.isPending)
        return (
            <View className="flex-1 bg-background">
                <AppBar title={t('tables.title')} />
                <ActivityIndicator />
            </View>
        );
    if (table.isError || views.isError)
        return (
            <View className="flex-1 bg-background">
                <AppBar title={t('tables.title')} />
                <EmptyState
                    icon="alert-circle-outline"
                    title={t('errors.generic')}
                    action={{
                        label: t('common.retry'),
                        onPress: () => {
                            void table.refetch();
                            void views.refetch();
                        },
                    }}
                />
            </View>
        );
    return <TableWorkspace table={table.data} views={views.data} />;
}
