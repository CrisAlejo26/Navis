import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ChurchDecision, CreateManagedUserInput, UpdateManagedUserInput } from '@navis/shared';

import { usersGateway } from '@/data/users/gateway';
import { UsersError, type Asker } from '@/data/users/users-gateway';
import { useUsersAsker, usersKey } from './use-users';

/**
 * Una mutación del puerto que, al acabar, deja la caché al día. La baja de una
 * cuenta puede arrastrar iglesias, creyentes y listas, así que invalida **todo**
 * (`scope: 'all'`); el resto, solo lo de usuarios. Con `removeQueries` en cambio
 * de iglesia —no aquí— ya se retiran las consultas acotadas.
 */
function useUsersMutation<Input, Output>(
    run: (asker: Asker, input: Input) => Promise<Output>,
    scope: 'users' | 'all' = 'users',
) {
    const { asker, enabled } = useUsersAsker();
    const client = useQueryClient();
    return useMutation({
        mutationFn: (input: Input) => {
            if (!enabled) throw new UsersError('not-found');
            return run(asker, input);
        },
        onSuccess: () =>
            client.invalidateQueries(scope === 'all' ? undefined : { queryKey: usersKey(asker) }),
    });
}

export const useCreateUser = () =>
    useUsersMutation((asker, input: CreateManagedUserInput) =>
        usersGateway.createUser(asker, input),
    );

export const useUpdateUser = () =>
    useUsersMutation((asker, input: { id: string; update: UpdateManagedUserInput }) =>
        usersGateway.updateUser(asker, input.id, input.update),
    );

export const useSetUserPassword = () =>
    useUsersMutation((asker, input: { id: string; password: string }) =>
        usersGateway.setPassword(asker, input.id, input.password),
    );

export const useRemoveUser = () =>
    useUsersMutation(
        (asker, input: { id: string; decisions?: ChurchDecision[] }) =>
            usersGateway.removeUser(asker, input.id, input.decisions),
        'all',
    );
