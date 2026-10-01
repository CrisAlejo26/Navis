import { useQuery } from '@tanstack/react-query';
import { resolveActiveChurch } from '@/data/repos/church-access';
import { useChurchTransition } from '@/stores/church-transition';
import { useLocalSession } from '@/stores/local-session';

/** No monta pantallas acotadas hasta reconciliar el espejo con SQLite. */
export function useChurchAccessGate() {
    const session = useLocalSession((state) => state.session);
    const hydrated = useLocalSession((state) => state.hydrated);
    const changing = useChurchTransition((state) => state.changing);
    const query = useQuery({
        queryKey: ['church-access', session?.userId, session?.churchId],
        enabled: hydrated && !!session && !changing,
        staleTime: 0,
        throwOnError: true,
        queryFn: async () => {
            if (!session) return null;
            const church = await resolveActiveChurch(session.userId);
            const current = useLocalSession.getState().session;
            if (
                current?.userId === session.userId &&
                current.churchId === session.churchId &&
                current.churchId !== (church?.id ?? null)
            ) {
                useLocalSession
                    .getState()
                    .setSession({ userId: current.userId, churchId: church?.id ?? null });
            }
            return church;
        },
    });
    return {
        ready: hydrated && !changing && (!session || (query.isSuccess && !query.isFetching)),
        session,
    };
}
