import { Alert } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { TaskStatus } from '@navis/shared';
import { useActivityDetail } from '@/hooks/use-activity-detail';
import { useActivityAction } from '@/hooks/use-activities';
import type { ItemKind } from '@/lib/tasks/editor-draft';
export function useActivityDetailScreen(kind: ItemKind, id: string, day?: string) {
    const query = useActivityDetail(kind, id, day),
        action = useActivityAction(),
        { t } = useTranslation();
    async function change(status: TaskStatus) {
        if (!query.data) return;
        try {
            await action.mutateAsync({ item: query.data.item, status });
        } catch {
            Alert.alert(t('tasks.saveFailed'), t('errors.generic'));
        }
    }
    function remove() {
        if (!query.data) return;
        const item = query.data.item;
        Alert.alert(t('tasks.deleteTitle', { title: item.title }), t('tasks.deleteConfirm'), [
            { text: t('common.cancel'), style: 'cancel' },
            {
                text: t('tasks.delete'),
                style: 'destructive',
                onPress: () => {
                    void action
                        .mutateAsync({ item })
                        .then(() => router.replace('/tasks'))
                        .catch(() => Alert.alert(t('tasks.saveFailed'), t('errors.generic')));
                },
            },
        ]);
    }
    return {
        query,
        busy: action.isPending,
        change,
        remove,
        edit: () =>
            router.push({
                pathname: '/tasks/edit',
                params: { kind, id, date: query.data?.item.date },
            }),
    };
}
