import { useState } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { addDays, eachDay, taskStreak90, todayIn, STREAK_STRIP_DAYS } from '@navis/shared';
import { useListContext } from '@/hooks/use-lists';
import { useTaskRange, useTaskStreak } from '@/hooks/use-tasks';
import { useActivityCalendar, useActivityAction } from '@/hooks/use-activities';
import { defaultFilters, type ActivityItem } from '@/lib/tasks/filters';

export function useTaskToday() {
    const scope = useListContext(),
        { t } = useTranslation();
    const today = todayIn(scope.church?.timezone ?? 'UTC');
    const [day, setDay] = useState(today),
        [kind, setKind] = useState<'task' | 'habit'>('habit');
    const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('all');
    const from = addDays(day, -3),
        to = addDays(day, 3);
    const listing = useActivityCalendar(defaultFilters(), today, true, { from, to });
    const streak = useTaskStreak(today),
        stripFrom = addDays(today, -(STREAK_STRIP_DAYS - 1));
    const history = useTaskRange(stripFrom, today),
        action = useActivityAction();
    const items = (listing.data ?? []).filter(
        (item) =>
            item.date === day &&
            (kind === 'task' ? 'taskId' in item : 'habitId' in item) &&
            (filter === 'all' || (item.status === 'completada') === (filter === 'done')),
    );
    const days = eachDay(from, to).map((date) => {
        const entries = (listing.data ?? []).filter(
            (item) => item.date === date && 'taskId' in item,
        );
        return {
            date,
            total: entries.length,
            done: entries.filter((item) => item.status === 'completada').length,
        };
    });
    async function toggle(item: ActivityItem) {
        try {
            await action.mutateAsync({
                item,
                status: item.status === 'completada' ? 'pendiente' : 'completada',
            });
        } catch {
            Alert.alert(t('tasks.saveFailed'), t('errors.generic'));
        }
    }
    function remove(item: ActivityItem) {
        Alert.alert(t('tasks.deleteTitle', { title: item.title }), t('tasks.deleteConfirm'), [
            { text: t('common.cancel'), style: 'cancel' },
            {
                text: t('tasks.delete'),
                style: 'destructive',
                onPress: () => {
                    void action
                        .mutateAsync({ item })
                        .catch(() => Alert.alert(t('tasks.saveFailed'), t('errors.generic')));
                },
            },
        ]);
    }
    return {
        scope,
        today,
        day,
        setDay,
        kind,
        setKind,
        filter,
        setFilter,
        items,
        days,
        listing,
        streak,
        history,
        action,
        toggle,
        remove,
        strip: taskStreak90(history.data ?? [], stripFrom, today),
    };
}
export type TaskTodayState = ReturnType<typeof useTaskToday>;
