import { useQuery } from '@tanstack/react-query';
import { taskStatistics, habitStatistics } from '@/data/repos/activity-stats';
import { useListContext } from './use-lists';

export function useActivityStats(today: string, from: string, to: string) {
    const { context, enabled } = useListContext();
    return useQuery({
        queryKey: [
            'local-activities',
            context.churchId,
            context.userId,
            'statistics',
            today,
            from,
            to,
        ],
        enabled,
        queryFn: async () => ({
            tasks: await taskStatistics(context, today, from, to),
            habits: await habitStatistics(context, from, to),
        }),
    });
}
