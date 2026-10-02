import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    readLists,
    readListMembers,
    listCandidates,
    type ListContext,
} from '@/data/repos/lists-repo';
import { useActiveChurchId } from './use-active-church-id';
import { useLocalSession } from '@/stores/local-session';
import { useMyChurches } from './use-my-churches';

export const listsKey = (context: ListContext) =>
    ['local-lists', context.churchId, context.userId] as const;
export function useListContext() {
    const churchId = useActiveChurchId();
    const userId = useLocalSession((state) => state.session?.userId);
    const churches = useMyChurches();
    const church = churches.data?.find((one) => one.id === churchId);
    return {
        context: { churchId: churchId ?? '', userId: userId ?? '' },
        enabled: Boolean(churchId && userId),
        canManage: Boolean(userId && church?.ownerId === userId),
        church,
    };
}
export function useLists() {
    const { context, enabled } = useListContext();
    return useQuery({
        queryKey: listsKey(context),
        queryFn: () => readLists(context, false),
        enabled,
    });
}
export function useListMembers(id: string) {
    const { context, enabled } = useListContext();
    return useQuery({
        queryKey: [...listsKey(context), id, 'members'],
        queryFn: () => readListMembers(context, id),
        enabled: enabled && Boolean(id),
    });
}
export function useListCandidates(id: string) {
    const { context, enabled } = useListContext();
    return useQuery({
        queryKey: [...listsKey(context), id, 'candidates'],
        queryFn: () => listCandidates(context, id),
        enabled: enabled && Boolean(id),
    });
}
export function useListMutation<T>(
    operation: (context: ListContext, input: T) => Promise<unknown>,
) {
    const { context, enabled } = useListContext();
    const client = useQueryClient();
    return useMutation({
        mutationFn: (input: T) => {
            if (!enabled) throw new Error('not-found');
            return operation(context, input);
        },
        onSuccess: () => client.invalidateQueries({ queryKey: listsKey(context) }),
    });
}
