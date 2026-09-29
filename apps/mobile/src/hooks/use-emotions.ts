import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { CreateEmotionInput, UpdateEmotionInput } from '@navis/shared';

import {
    createEmotion,
    deleteEmotion,
    listEmotions,
    updateEmotion,
} from '@/data/repos/emotions-repo';
import { useLocalSession } from '@/stores/local-session';

/** El vocabulario de emociones **en local**: las de serie y las del dueño, con su uso. */

export function useEmotions() {
    const ownerId = useLocalSession((state) => state.session?.userId);
    return useQuery({
        queryKey: ['emotions', ownerId],
        queryFn: () => {
            if (!ownerId) throw new Error('Sin sesión no hay emociones');
            return listEmotions(ownerId);
        },
        enabled: Boolean(ownerId),
    });
}

/** Cambiar el vocabulario cambia lo que pintan la ficha, el listado y la portada. */
function useInvalidate() {
    const client = useQueryClient();
    const ownerId = useLocalSession((state) => state.session?.userId);
    return () =>
        Promise.all([
            client.invalidateQueries({ queryKey: ['emotions', ownerId] }),
            client.invalidateQueries({ queryKey: ['dreams', ownerId] }),
        ]);
}

export function useCreateEmotion() {
    const ownerId = useLocalSession((state) => state.session?.userId);
    const invalidate = useInvalidate();
    return useMutation({
        mutationFn: (input: CreateEmotionInput) => {
            if (!ownerId) throw new Error('Sin sesión no se crea nada');
            return createEmotion(ownerId, input);
        },
        onSuccess: invalidate,
    });
}

export function useUpdateEmotion() {
    const ownerId = useLocalSession((state) => state.session?.userId);
    const invalidate = useInvalidate();
    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: UpdateEmotionInput }) => {
            if (!ownerId) throw new Error('Sin sesión no se guarda');
            return updateEmotion(ownerId, id, input);
        },
        onSuccess: invalidate,
    });
}

export function useDeleteEmotion() {
    const ownerId = useLocalSession((state) => state.session?.userId);
    const invalidate = useInvalidate();
    return useMutation({
        mutationFn: (id: string) => {
            if (!ownerId) throw new Error('Sin sesión no se borra');
            return deleteEmotion(ownerId, id);
        },
        onSuccess: invalidate,
    });
}
