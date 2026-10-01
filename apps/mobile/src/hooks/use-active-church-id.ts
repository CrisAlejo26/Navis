import { useEffect } from 'react';
import { router } from 'expo-router';
import { useChurchTransition } from '@/stores/church-transition';
import { useLocalSession } from '@/stores/local-session';

/** La puerta de pestañas valida SQLite; este hook bloquea consultas durante el cambio. */
export function useActiveChurchId(): string | null {
    const session = useLocalSession((state) => state.session);
    const hydrated = useLocalSession((state) => state.hydrated);
    const changing = useChurchTransition((state) => state.changing);
    useEffect(() => {
        if (!hydrated || changing || session?.churchId) return;
        router.replace(session ? '/(auth)/church-setup' : '/(auth)/welcome');
    }, [hydrated, changing, session]);
    return changing ? null : (session?.churchId ?? null);
}
