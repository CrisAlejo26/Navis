import { findDuplicateCandidates, type DuplicatePair, type PersonCandidate } from '@navis/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getDb } from '@/data/db';
import { syncRunner } from '@/lib/sync/device-runner';
import { mergeBelievers } from '@/lib/sync/merge-believers';

import { useActiveChurchId } from './use-active-church-id';

export interface DuplicateView extends DuplicatePair {
    first: PersonCandidate;
    second: PersonCandidate;
}

interface PersonRow {
    id: string;
    church_id: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    email: string | null;
}

/** Los pares de fichas que se parecen en la iglesia activa. Solo sugerencias: fusionar lo decide la persona. */
export function useDuplicates() {
    const churchId = useActiveChurchId();
    return useQuery({
        queryKey: ['sync', 'duplicates', churchId],
        enabled: churchId !== null,
        queryFn: async (): Promise<DuplicateView[]> => {
            const rows = await (
                await getDb()
            ).getAllAsync<PersonRow>(
                'SELECT id, church_id, first_name, last_name, phone, email FROM believers WHERE church_id = ? AND deleted_at IS NULL',
                churchId ?? '',
            );
            const people: PersonCandidate[] = rows.map((row) => ({
                id: row.id,
                churchId: row.church_id,
                firstName: row.first_name,
                lastName: row.last_name,
                phone: row.phone,
                email: row.email,
            }));
            const byId = new Map(people.map((person) => [person.id, person]));
            return findDuplicateCandidates(people).flatMap((pair) => {
                const [first, second] = [byId.get(pair.a), byId.get(pair.b)];
                return first && second ? [{ ...pair, first, second }] : [];
            });
        },
    });
}

/** Fusiona dos fichas (conserva `keep`, retira `drop`) y sincroniza: viaja como cualquier edición. */
export function useMergeBelievers() {
    const client = useQueryClient();
    return useMutation({
        mutationFn: async (input: { keep: string; drop: string }) => {
            const result = await mergeBelievers(
                await getDb(),
                input.keep,
                input.drop,
                new Date().toISOString(),
            );
            if (result !== 'invalid') {
                void syncRunner.syncNow({ manual: true }).catch(() => undefined);
            }
            return result;
        },
        onSuccess: () => client.invalidateQueries(),
    });
}
