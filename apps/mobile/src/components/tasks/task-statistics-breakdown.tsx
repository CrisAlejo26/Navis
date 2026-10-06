import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ActivityBlock } from './activity-block';
import { TaskTagBadges } from './task-tag-badges';
import { priorityKeys } from './task-theme';
import type { TaskStatisticsState } from './use-task-statistics';
import { formatNumber } from '@/lib/format';

export function TaskStatisticsBreakdown({ state: s }: { state: TaskStatisticsState }) {
    const { t } = useTranslation();
    return (
        <>
            {s.kind === 'task' && (
                <ActivityBlock title={t('tasks.statsByPriority')}>
                    {s.query.data?.tasks.byPriority.map((bucket) => (
                        <View
                            key={bucket.priority}
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                gap: 16,
                            }}
                        >
                            <Text className="font-sans text-sm text-foreground">
                                {t(priorityKeys[bucket.priority])}
                            </Text>
                            <Text className="font-sans-semibold text-sm text-foreground">
                                {formatNumber(bucket.count)}
                            </Text>
                        </View>
                    ))}
                </ActivityBlock>
            )}
            <ActivityBlock title={t('tasks.statsByTag')}>
                {!s.stats?.byTag.length && (
                    <Text className="font-sans text-sm text-muted-foreground">
                        {t('tasks.mobile.noTags')}
                    </Text>
                )}
                {s.stats?.byTag.map((bucket) => (
                    <View
                        key={bucket.tagId}
                        style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 16 }}
                    >
                        <View style={{ flex: 1 }}>
                            <TaskTagBadges
                                tags={[
                                    {
                                        id: bucket.tagId,
                                        name: bucket.name,
                                        icon: bucket.icon,
                                        accent: bucket.accent,
                                    },
                                ]}
                            />
                        </View>
                        <Text className="font-sans-semibold text-sm text-foreground">
                            {formatNumber(bucket.count)}
                        </Text>
                    </View>
                ))}
            </ActivityBlock>
        </>
    );
}
