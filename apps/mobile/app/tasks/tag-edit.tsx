import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTaskTags } from '@/hooks/use-tags';
import { useListContext } from '@/hooks/use-lists';
import { TagEditor } from '@/components/tasks/tag-editor';
import { ActivityQueryState } from '@/components/tasks/activity-query-state';
export default function TagEditRoute() {
    const { id } = useLocalSearchParams<{ id?: string }>(),
        tags = useTaskTags(),
        scope = useListContext(),
        { t } = useTranslation();
    const previous = tags.data?.find((tag) => tag.id === id);
    if (id && !previous)
        return (
            <ActivityQueryState
                title={t('tasks.editTag')}
                layout="tag-editor"
                pending={tags.isPending}
                error={tags.isError}
                onRetry={() => void tags.refetch()}
            />
        );
    return (
        <TagEditor
            key={`${scope.context.churchId}:${scope.context.userId}:${id ?? 'new'}`}
            previous={previous}
        />
    );
}
