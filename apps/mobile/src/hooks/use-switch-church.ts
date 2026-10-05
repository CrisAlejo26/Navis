import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { assertAccessible, setActiveChurch } from '@/data/repos/church-access';
import { useActiveCalendarStore } from '@/lib/calendar/active-calendar';
import { showChurchChanged } from '@/lib/church-changed-notice';
import { syncNotifications } from '@/lib/notifications/sync';
import { useChurchTransition } from '@/stores/church-transition';
import { useLocalSession, type LocalSession } from '@/stores/local-session';

const scopedPrefixes = new Set([
    'local-tables',
    'believers',
    'calendar',
    'catalog',
    'dashboard',
    'local-church',
    'church',
    'demo-data',
    'church-access',
]);
let running = false;
function assertSameSession(expected: LocalSession): void {
    const current = useLocalSession.getState().session;
    if (current?.userId !== expected.userId || current.churchId !== expected.churchId) {
        throw new Error('session-changed');
    }
}

/** Único cambio de contexto: SQLite primero, sesión después y raíces recién montadas. */
export function useSwitchChurch() {
    const client = useQueryClient();
    const mutation = useMutation({
        mutationFn: async (churchId: string) => {
            if (running) throw new Error('church-switch-in-progress');
            const session = useLocalSession.getState().session;
            if (!session) throw new Error('no-session');
            running = true;
            try {
                const church = await assertAccessible(session.userId, churchId);
                assertSameSession(session);
                if (session.churchId === churchId) return church;
                useChurchTransition.setState({ changing: true });
                await client.cancelQueries();
                assertSameSession(session);
                await setActiveChurch(session.userId, churchId);
                assertSameSession(session);
                useLocalSession.getState().setChurch(churchId);
                useActiveCalendarStore.getState().reset();
                client.removeQueries({
                    predicate: (query) => scopedPrefixes.has(String(query.queryKey[0])),
                });
                await client.invalidateQueries();
                assertSameSession({ ...session, churchId });
                if (router.canDismiss()) router.dismissAll();
                router.replace('/(tabs)');
                await syncNotifications();
                assertSameSession({ ...session, churchId });
                showChurchChanged(church.name);
                return church;
            } finally {
                useChurchTransition.setState({ changing: false });
                running = false;
            }
        },
    });
    return {
        switchChurch: mutation.mutateAsync,
        isPending: mutation.isPending,
        error: mutation.error,
    };
}
