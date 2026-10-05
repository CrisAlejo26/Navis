import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SearchField } from '@/components/ui/search-field';
import { Chip } from '@/components/ui/chip';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { quickRange, type TaskFilters } from '@/lib/tasks/filters';
export function FilterScope({
    draft,
    onChange,
    today,
    timezone,
}: {
    draft: TaskFilters;
    onChange: (f: TaskFilters) => void;
    today: string;
    timezone: string;
}) {
    const { t } = useTranslation();
    const ranges = {
        today: 'tasks.filterToday',
        tomorrow: 'tasks.filterTomorrow',
        week: 'tasks.filterThisWeek',
        month: 'tasks.filterThisMonth',
        overdue: 'tasks.filterOverdue',
    } as const;
    return (
        <View className="gap-4">
            <SearchField
                value={draft.search ?? ''}
                onChangeText={(search) => onChange({ ...draft, search })}
                placeholder={t('tasks.mobile.searchPlaceholder')}
            />
            <Text className="font-sans-semibold text-base text-foreground">
                {t('tasks.filterType')}
            </Text>
            <View className="gap-2 flex-row flex-wrap">
                {(['both', 'task', 'habit'] as const).map((type) => (
                    <Chip
                        key={type}
                        label={t(
                            type === 'both'
                                ? 'tasks.filterBoth'
                                : type === 'task'
                                  ? 'tasks.tasksTab'
                                  : 'tasks.habitsTab',
                        )}
                        selected={draft.type === type}
                        onPress={() => onChange({ ...draft, type })}
                    />
                ))}
            </View>
            <Text className="font-sans-semibold text-base text-foreground">{t('tasks.date')}</Text>
            <View className="gap-2 flex-row flex-wrap">
                <Chip
                    label={t('tasks.mobile.defaultRange')}
                    selected={!draft.from && !draft.to}
                    onPress={() => onChange({ ...draft, from: undefined, to: undefined })}
                />
                {(Object.keys(ranges) as (keyof typeof ranges)[]).map((key) => {
                    const range = quickRange(key, today);
                    return (
                        <Chip
                            key={key}
                            label={t(ranges[key])}
                            selected={draft.from === range.from && draft.to === range.to}
                            onPress={() => onChange({ ...draft, ...range })}
                        />
                    );
                })}
            </View>
            <DateRangePicker
                label={t('tasks.filterDateCustom')}
                placeholder={t('tasks.filterDateCustom')}
                timezone={timezone}
                value={draft.from && draft.to ? { from: draft.from, to: draft.to } : null}
                onChange={(range) => onChange({ ...draft, ...range })}
            />
        </View>
    );
}
