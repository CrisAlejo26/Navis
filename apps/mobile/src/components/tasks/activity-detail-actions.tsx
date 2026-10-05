import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import type { ActivityItem } from '@/lib/tasks/filters';
import type { useActivityDetailScreen } from './use-activity-detail-screen';
export function ActivityDetailActions({
    state: d,
    item,
}: {
    state: ReturnType<typeof useActivityDetailScreen>;
    item: ActivityItem;
}) {
    const { t } = useTranslation();
    return (
        <>
            <View className="gap-3 flex-row flex-wrap">
                <View className="flex-1">
                    <Button
                        title={t('tasks.edit')}
                        variant="secondary"
                        className="rounded-2xl"
                        disabled={d.busy}
                        onPress={d.edit}
                    />
                </View>
                <View className="flex-1">
                    <Button
                        title={t(item.status === 'completada' ? 'tasks.reopen' : 'tasks.complete')}
                        className="rounded-2xl"
                        loading={d.busy}
                        onPress={() =>
                            void d.change(item.status === 'completada' ? 'pendiente' : 'completada')
                        }
                    />
                </View>
            </View>
            <Button
                title={t('tasks.delete')}
                variant="outline"
                className="rounded-2xl"
                leadingIcon="trash-outline"
                disabled={d.busy}
                onPress={d.remove}
            />
        </>
    );
}
