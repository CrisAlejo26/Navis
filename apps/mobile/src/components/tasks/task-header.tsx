import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { SearchField } from '@/components/ui/search-field';
import { Button } from '@/components/ui/button';
import { Title } from '@/components/ui/title';
import { Skeleton } from '@/components/ui/skeleton';
import { TaskLoading } from './task-loading';
import { filterCount, type TaskFilters } from '@/lib/tasks/filters';
import { TaskActiveFilters } from './task-active-filters';
export function TaskHeader({
    filters,
    onChange,
    view,
    onView,
    pending,
    done,
    total,
    onFilters,
    loading = false,
}: {
    filters: TaskFilters;
    onChange: (filters: TaskFilters) => void;
    view: 'list' | 'calendar';
    onView: (view: 'list' | 'calendar') => void;
    pending: number;
    done: number;
    total: number;
    onFilters: () => void;
    loading?: boolean;
}) {
    const { t } = useTranslation(),
        count = filterCount(filters);
    return (
        <View className="gap-4 pt-2">
            <View className="gap-1">
                <Title size="lg">{t('tasks.title')}</Title>
                {loading ? (
                    <TaskLoading>
                        <Skeleton style={{ width: '65%', height: 20 }} />
                    </TaskLoading>
                ) : (
                    <Text className="font-sans-medium text-[13px] text-muted-foreground">
                        {t('tasks.mobile.summary', { pending, done })}
                    </Text>
                )}
            </View>
            <SegmentedControl
                value={view}
                onChange={onView}
                options={[
                    { value: 'list', label: t('tasks.viewList') },
                    { value: 'calendar', label: t('tasks.viewCalendar') },
                ]}
            />
            <SearchField
                value={filters.search ?? ''}
                onChangeText={(search) => onChange({ ...filters, search })}
                placeholder={t('tasks.mobile.searchPlaceholder')}
            />
            <Button
                title={t(count ? 'tasks.mobile.filtersCount' : 'tasks.mobile.filters', { count })}
                variant="secondary"
                leadingIcon="options-outline"
                className="rounded-2xl"
                onPress={onFilters}
            />
            <TaskActiveFilters filters={filters} onChange={onChange} />
            {count > 0 &&
                (loading ? (
                    <TaskLoading>
                        <Skeleton className="h-4 w-28" />
                    </TaskLoading>
                ) : (
                    <Text className="font-sans-medium text-xs text-muted-foreground">
                        {t('tasks.mobile.matches', { count: total })}
                    </Text>
                ))}
        </View>
    );
}
