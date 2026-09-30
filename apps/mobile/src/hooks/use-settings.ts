import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { findUser, type LocalUser } from '@/data/repos/account-repo';
import { findChurch, type LocalChurch } from '@/data/repos/church-repo';
import { updateChurch } from '@/data/repos/church-update';
import { updateProfile } from '@/data/repos/profile-repo';
import { useLocalSession } from '@/stores/local-session';

/** La cuenta con la sesión abierta; el concentrador y los formularios comparten esta clave. */
export function useLocalUser() {
    const userId = useLocalSession((state) => state.session?.userId);
    return useQuery<LocalUser | null>({
        queryKey: ['local-user', userId],
        queryFn: () => findUser(userId!),
        enabled: Boolean(userId),
    });
}

export function useLocalChurch() {
    const churchId = useLocalSession((state) => state.session?.churchId);
    return useQuery<LocalChurch | null>({
        queryKey: ['local-church', churchId],
        queryFn: () => findChurch(churchId!),
        enabled: Boolean(churchId),
    });
}

export function useUpdateProfile() {
    const client = useQueryClient();
    const userId = useLocalSession((state) => state.session?.userId);
    return useMutation({
        mutationFn: (input: unknown) => updateProfile(userId!, input),
        onSuccess: () => client.invalidateQueries({ queryKey: ['local-user'] }),
    });
}

/**
 * La zona horaria de la iglesia manda en el calendario: al guardar se invalida
 * también todo lo del calendario, o el mes seguiría calculado con la vieja.
 */
export function useUpdateChurch() {
    const client = useQueryClient();
    const churchId = useLocalSession((state) => state.session?.churchId);
    return useMutation({
        mutationFn: (input: unknown) => updateChurch(churchId!, input),
        onSuccess: async () => {
            await client.invalidateQueries({ queryKey: ['local-church'] });
            await client.invalidateQueries({ queryKey: ['calendar'] });
        },
    });
}
