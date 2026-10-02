import { useQuery } from '@tanstack/react-query';
import { listsKey, useListContext } from './use-lists';
import { readListViewers, viewerCandidates } from '@/data/repos/list-viewers-reads';

export function useLocalListViewers() {
    const { context, enabled, canManage } = useListContext();
    return useQuery({
        queryKey: [...listsKey(context), 'viewers'],
        queryFn: () => readListViewers(context),
        enabled: enabled && canManage,
    });
}
export function useViewerCandidates() {
    const { context, enabled, canManage } = useListContext();
    return useQuery({
        queryKey: [...listsKey(context), 'viewer-candidates'],
        queryFn: () => viewerCandidates(context),
        enabled: enabled && canManage,
    });
}
