import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import { listsKey, useListContext } from '@/hooks/use-lists';
import { readListStats } from '@/data/repos/list-stats';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function StatsSection({ id, bottom }: { id: string; bottom: number }) {
    const { t } = useTranslation();
    const { context, enabled } = useListContext();
    const stats = useQuery({
        queryKey: [...listsKey(context), id, 'stats'],
        queryFn: () => readListStats(context, id),
        enabled,
    });
    if (stats.isPending)
        return <Text className="p-4 text-muted-foreground">{t('common.loading')}</Text>;
    if (stats.isError)
        return (
            <View className="gap-3 p-4">
                <Text className="text-destructive">{t('errors.generic')}</Text>
                <Button title={t('common.retry')} onPress={() => void stats.refetch()} />
            </View>
        );
    const groups = [
        { title: t('calendar.congregations'), rows: stats.data.congregations },
        { title: t('believers.ministries'), rows: stats.data.ministries },
        { title: t('gifts.title'), rows: stats.data.gifts },
        { title: t('lists.overlap'), rows: stats.data.overlap },
    ];
    return (
        <ScrollView contentContainerStyle={{ gap: 16, padding: 16, paddingBottom: bottom }}>
            {groups.map((group) => (
                <Card key={group.title} title={group.title}>
                    {group.rows.length ? (
                        group.rows.map((row) => (
                            <View key={row.id} className="gap-3 flex-row justify-between">
                                <Text className="flex-1 text-foreground">{row.name}</Text>
                                <Text className="font-sans-semibold text-foreground">
                                    {row.count}
                                </Text>
                            </View>
                        ))
                    ) : (
                        <Text className="text-muted-foreground">{t('lists.noComposition')}</Text>
                    )}
                </Card>
            ))}
            <Text className="text-sm text-muted-foreground">{t('lists.localAudienceHint')}</Text>
        </ScrollView>
    );
}
