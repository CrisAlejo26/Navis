import { useQuery } from '@tanstack/react-query';
import { listMyChurches } from '@/data/repos/church-access';
import { useLocalSession } from '@/stores/local-session';

export function useMyChurches() {
    const userId = useLocalSession((state) => state.session?.userId);
    return useQuery({
        queryKey: ['my-churches', userId],
        queryFn: () => listMyChurches(userId!),
        enabled: !!userId,
    });
}
