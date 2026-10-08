import { useState } from 'react';
import type { ManagedUser, OwnedChurchImpact } from '@navis/shared';

import { UsersError } from '@/data/users/users-gateway';
import { useRemoveUser } from '@/hooks/use-users-mutations';
import { userErrorKey, type UserErrorKey } from '@/lib/users/user-errors';

/**
 * La baja de una cuenta en dos pasos (RFC 0015): primero se intenta sin más y,
 * si es dueña de iglesias, el puerto responde con lo que se llevaría por delante
 * (`owns-churches`). Ese es el paso 2: se enseña el impacto y, al confirmar, se
 * reenvía con una decisión por iglesia. En el teléfono la única es «eliminar»:
 * trasladar funde catálogos y mueve ficheros, y todavía no está.
 */
export function useDeleteUser(user: ManagedUser, onDeleted: () => void) {
    const remove = useRemoveUser();
    const [impacts, setImpacts] = useState<OwnedChurchImpact[] | null>(null);
    const [failure, setFailure] = useState<UserErrorKey | null>(null);

    async function confirm(): Promise<void> {
        setFailure(null);
        try {
            await remove.mutateAsync({
                id: user.id,
                decisions: impacts?.map((one) => ({ churchId: one.id, action: 'delete' as const })),
            });
            onDeleted();
        } catch (error) {
            if (error instanceof UsersError && error.code === 'owns-churches' && error.data)
                setImpacts(error.data.ownedChurches);
            else setFailure(userErrorKey(error));
        }
    }

    return { impacts, failure, busy: remove.isPending, confirm };
}
