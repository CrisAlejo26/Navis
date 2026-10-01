import { createChurchSchema, COUNTRY_CODES } from '@navis/shared';
import { useMutation } from '@tanstack/react-query';
import { createChurch } from '@/data/repos/church-repo';
import { useLocalSession } from '@/stores/local-session';
import { useSwitchChurch } from './use-switch-church';

export function useCreateChurch() {
    const change = useSwitchChurch();
    return useMutation({
        mutationFn: async (input: { name: string; city: string; country: string }) => {
            const session = useLocalSession.getState().session;
            if (!session) throw new Error('no-session');
            const parsed = createChurchSchema.safeParse(input);
            if (!parsed.success) throw new Error('invalid-input');
            if (!COUNTRY_CODES.some((code) => code === input.country))
                throw new Error('invalid-country');
            const church = await createChurch({
                ...parsed.data,
                country: input.country,
                ownerId: session.userId,
            });
            await change.switchChurch(church.id);
            return church;
        },
    });
}
