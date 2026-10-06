import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { todayIn, monthGrid } from '@navis/shared';
import { useListContext } from '@/hooks/use-lists';
import {
    useActivities,
    useActivityCalendar,
    useActivityAction,
    useHasActivities,
} from '@/hooks/use-activities';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { defaultFilters, type TaskFilters, type ActivityItem } from '@/lib/tasks/filters';
import { activitySections } from '@/lib/tasks/sections';
import type { TaskStatus } from '@navis/shared';

export function useTaskDirectory() {
    const scope = useListContext(),
        { t } = useTranslation(),
        timezone = scope.church?.timezone ?? 'UTC',
        today = todayIn(timezone);
    const params = useLocalSearchParams<{ sort?: string }>();
    const [filters, setFilters] = useState<TaskFilters>(() => ({ ...defaultFilters(), ...(params.sort === 'manual' ? { sort: 'manual' as const, group: 'none' as const } : {}) })),
        [view, setView] = useState<'list' | 'calendar'>('list');
    const [month, setMonth] = useState(today),
        [day, setDay] = useState(today),
        [filtersOpen, setFiltersOpen] = useState(false);
    const search = useDebouncedValue(filters.search ?? ''),
        request = { ...filters, search };
    const listing = useActivities(
        request,
        today,
        view === 'calendar' ? { from: day, to: day } : undefined,
    );
    const grid = monthGrid(month),
        calendar = useActivityCalendar(request, today, view === 'calendar', grid);
    const exists = useHasActivities(),
        action = useActivityAction();
    const items = listing.data?.pages.flatMap((page) => page.items) ?? [];
    const sections = activitySections(items, filters.group, today);
    async function change(item: ActivityItem, status?: TaskStatus) {
        try {
            await action.mutateAsync({ item, status });
        } catch {
            Alert.alert(t('tasks.saveFailed'), t('errors.generic'));
        }
    }
    function remove(item: ActivityItem) {
        Alert.alert(t('tasks.deleteTitle', { title: item.title }), t('tasks.deleteConfirm'), [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('tasks.delete'), style: 'destructive', onPress: () => void change(item) },
        ]);
    }
    return {
        scope,
        timezone,
        today,
        filters,
        setFilters,
        view,
        setView,
        month,
        setMonth,
        day,
        setDay,
        filtersOpen,
        setFiltersOpen,
        listing,
        calendar,
        exists,
        action,
        items,
        sections,
        change,
        remove,
    };
}
export type TaskDirectoryState = ReturnType<typeof useTaskDirectory>;
