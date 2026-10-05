import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { formatDay, formatNumber } from '@/lib/format';
import type { ActivitySection } from '@/lib/tasks/sections';
import type { TaskGroup } from '@/lib/tasks/filters';
import { statusKeys, priorityKeys, useTaskPalette } from './task-theme';
export function TaskSection({
    section,
    group,
    today,
}: {
    section: ActivitySection;
    group: TaskGroup;
    today: string;
}) {
    const { t } = useTranslation(),
        p = useTaskPalette(),
        key = section.key;
    const title =
        group === 'date'
            ? key === 'overdue'
                ? t('tasks.filterOverdue')
                : key === today
                  ? t('tasks.today')
                  : formatDay(key)
            : group === 'status' && key in statusKeys
              ? t(statusKeys[key as keyof typeof statusKeys])
              : group === 'priority'
                ? key in priorityKeys
                    ? t(priorityKeys[key as keyof typeof priorityKeys])
                    : t('tasks.habitsTab')
                : group === 'tag'
                  ? section.title || t('tasks.mobile.untagged')
                  : t('tasks.list');
    return (
        <View className="gap-2 pb-3 pt-4 flex-row items-center">
            <Text
                accessibilityRole="header"
                className="font-sans-semibold flex-1 text-[15px]"
                style={{ color: section.warn ? p.warning : p.foreground }}
            >
                {title}
            </Text>
            <Text className="font-sans-medium text-xs text-muted-foreground">
                {formatNumber(section.data.length)}
            </Text>
        </View>
    );
}
