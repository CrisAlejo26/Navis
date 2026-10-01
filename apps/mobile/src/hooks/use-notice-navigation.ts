import { router, useRootNavigationState, useSegments } from 'expo-router';
import { useIsFetching, useMutation } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { prepareNotice } from '@/lib/notifications/prepare-notice';
import { hrefForNotice } from '@/lib/notifications/routes';
import { useChurchTransition } from '@/stores/church-transition';
import { useLocalSession } from '@/stores/local-session';
import { useSwitchChurch } from './use-switch-church';

type Destination = NonNullable<Awaited<ReturnType<typeof prepareNotice>>>;

/** Tras cambiar, espera a las pestañas: su Redirect no debe pisar la nota. */
export function useNoticeNavigation() {
    const rootKey = useRootNavigationState()?.key;
    const inTabs = useSegments()[0] === '(tabs)';
    const hydrated = useLocalSession((state) => state.hydrated);
    const session = useLocalSession((state) => state.session);
    const changing = useChurchTransition((state) => state.changing);
    const checkingAccess = useIsFetching({ queryKey: ['church-access'] });
    const { switchChurch } = useSwitchChurch();
    const [pending, setPending] = useState<{ raw: unknown } | null>(null);
    const handled = useRef<typeof pending>(null);
    const opened = useRef<Destination | null>(null);
    const {
        mutate,
        data: destination,
        isPending,
    } = useMutation({
        mutationFn: (raw: unknown) => prepareNotice(raw, switchChurch),
        onError: (error: unknown) => console.warn('No he podido abrir el aviso:', error),
    });
    const open = useCallback((raw: unknown) => setPending({ raw }), []);

    useEffect(() => {
        if (
            !pending ||
            pending === handled.current ||
            !rootKey ||
            !hydrated ||
            !session ||
            changing ||
            isPending
        )
            return;
        handled.current = pending;
        mutate(pending.raw);
    }, [pending, rootKey, hydrated, session, changing, mutate, isPending]);

    useEffect(() => {
        if (
            !destination ||
            destination === opened.current ||
            changing ||
            checkingAccess ||
            isPending ||
            !rootKey ||
            !hydrated
        )
            return;
        if (
            session?.churchId !== destination.data.churchId ||
            session.userId !== destination.userId
        ) {
            opened.current = destination;
            return;
        }
        if (destination.switched && !inTabs) return;
        opened.current = destination;
        const href = hrefForNotice(destination.data);
        if (href) router.push(href);
    }, [destination, changing, checkingAccess, isPending, rootKey, hydrated, session, inTabs]);
    return open;
}
