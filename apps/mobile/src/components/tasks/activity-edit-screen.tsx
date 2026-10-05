import { useTranslation } from 'react-i18next';
import { useActivityDetail } from '@/hooks/use-activity-detail';
import { useListContext } from '@/hooks/use-lists';
import { ActivityEditor } from './activity-editor';
import { ActivityQueryState } from './activity-query-state';
import type { ItemKind } from '@/lib/tasks/editor-draft';
export function ActivityEditScreen({
    kind,
    id,
    day,
}: {
    kind: ItemKind;
    id?: string;
    day?: string;
}) {
    const detail = useActivityDetail(kind, id ?? '', day),
        scope = useListContext(),
        { t } = useTranslation();
    if (id && !detail.data)
        return (
            <ActivityQueryState
                title={t('tasks.edit')}
                pending={detail.isPending}
                error={detail.isError}
                onRetry={() => void detail.refetch()}
            />
        );
    return (
        <ActivityEditor
            key={`${scope.context.churchId}:${scope.context.userId}:${id ?? 'new'}`}
            kind={kind}
            previous={detail.data?.template}
            day={detail.data?.item.date ?? day}
            status={detail.data?.item.status}
        />
    );
}
