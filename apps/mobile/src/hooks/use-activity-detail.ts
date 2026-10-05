import { useQuery } from '@tanstack/react-query';
import { isoDateSchema } from '@navis/shared';
import { findTask, taskRange } from '@/data/repos/tasks-repo';
import { findHabit, habitRange } from '@/data/repos/habits-repo';
import { useListContext } from './use-lists';
import type { ItemKind } from '@/lib/tasks/editor-draft';
export function useActivityDetail(kind: ItemKind, id: string, day?: string) {
    const scope = useListContext();
    const query = useQuery({
        queryKey: [
            kind === 'task' ? 'local-tasks' : 'local-habits',
            scope.context.churchId,
            scope.context.userId,
            'detail',
            id,
            day,
        ],
        enabled: scope.enabled && Boolean(id),
        queryFn: async () => {
            const template = await (kind === 'task' ? findTask : findHabit)(scope.context, id);
            if (!template) return null;
            const date = isoDateSchema.safeParse(day).success ? day! : template.date;
            const items = await (kind === 'task' ? taskRange : habitRange)(
                scope.context,
                date,
                date,
            );
            const item = items.find(
                (item) => ('taskId' in item ? item.taskId : item.habitId) === id,
            );
            return item ? { template, item } : null;
        },
    });
    return { ...query, scope };
}
