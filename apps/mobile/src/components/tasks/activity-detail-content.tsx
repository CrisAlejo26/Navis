import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Task, Habit } from '@navis/shared';
import { ActivityBlock } from './activity-block';
import { TaskTagBadges } from './task-tag-badges';
import { formatDay } from '@/lib/format';
import { reminderParts } from '@/lib/tasks/reminder-time';
import type { ActivityItem } from '@/lib/tasks/filters';
const repeatKeys = {
    diaria: 'tasks.repeatDaily',
    semanal: 'tasks.repeatWeekly',
    mensual: 'tasks.repeatMonthly',
    ninguna: 'tasks.repeatNone',
    fechas: 'tasks.repeatDates',
} as const;

export function ActivityDetailContent({
    item,
    template,
    timezone,
}: {
    item: ActivityItem;
    template: Task | Habit;
    timezone: string;
}) {
    const { t } = useTranslation();
    const reminder = item.reminder?.enabled
        ? reminderParts(item.reminder.remindAt, timezone)
        : null;
    return (
        <>
            <ActivityBlock title={t('tasks.tags')}>
                {item.tags.length ? (
                    <View className="gap-2 flex-row flex-wrap">
                        <TaskTagBadges tags={item.tags} />
                    </View>
                ) : (
                    <Text className="font-sans text-sm text-muted-foreground">
                        {t('tasks.mobile.untagged')}
                    </Text>
                )}
            </ActivityBlock>
            {item.description && (
                <ActivityBlock title={t('tasks.description')}>
                    <Text className="font-sans leading-6 text-[15px] text-foreground">
                        {item.description}
                    </Text>
                </ActivityBlock>
            )}
            {'goal' in item && item.goal && (
                <ActivityBlock title={t('tasks.goal')}>
                    <Text className="font-sans-medium text-base text-foreground">{item.goal}</Text>
                </ActivityBlock>
            )}
            {item.isRecurring && template.repeatFreq && (
                <ActivityBlock title={t('tasks.repeat')}>
                    <Text className="font-sans-medium text-base text-foreground">
                        {t(repeatKeys[template.repeatFreq])}
                        {'repeatInterval' in template && template.repeatInterval > 1
                            ? ` · ${template.repeatInterval}`
                            : ''}
                    </Text>
                </ActivityBlock>
            )}
            {reminder && (
                <ActivityBlock title={t('tasks.reminder')}>
                    <Text className="font-sans-medium text-base text-foreground">
                        {formatDay(reminder.date)} · {reminder.time}
                    </Text>
                    <Text className="font-sans text-xs text-muted-foreground">
                        {t('tasks.editor.timezone', { timezone })}
                    </Text>
                    <View className="gap-2 flex-row flex-wrap">
                        <TaskTagBadges tags={item.reminder?.tags ?? []} />
                    </View>
                </ActivityBlock>
            )}
        </>
    );
}
