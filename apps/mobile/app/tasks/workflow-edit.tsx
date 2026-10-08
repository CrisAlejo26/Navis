import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useWorkflows } from '@/hooks/use-workflows';
import { useListContext } from '@/hooks/use-lists';
import { WorkflowEditor } from '@/components/tasks/workflow-editor';
import { ActivityQueryState } from '@/components/tasks/activity-query-state';

export default function WorkflowEditRoute() {
    const { id } = useLocalSearchParams<{ id?: string }>(),
        workflows = useWorkflows(),
        scope = useListContext(),
        { t } = useTranslation();
    const previous = workflows.data?.find((workflow) => workflow.id === id);
    if (id && !previous)
        return (
            <ActivityQueryState
                title={t('tasks.editWorkflow')}
                layout="tag-editor"
                pending={workflows.isPending}
                error={workflows.isError}
                onRetry={() => void workflows.refetch()}
            />
        );
    return (
        <WorkflowEditor
            key={`${scope.context.churchId}:${scope.context.userId}:${id ?? 'new'}`}
            previous={previous}
        />
    );
}
