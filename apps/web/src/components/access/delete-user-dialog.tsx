import { ApiError, useDeleteUser } from '@navis/api-client';
import type { ManagedUser, OwnedChurchImpact } from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ChurchDecisionRow } from '@/components/access/church-decision-row';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  churchesBeingDeleted,
  decisionsComplete,
  ownedChurchesFrom,
  toChurchDecisions,
  type ChurchDecisions,
} from '@/lib/church-decisions';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

interface DeleteUserDialogProps {
  user: ManagedUser | null;
  onClose: () => void;
}

/**
 * Baja de una cuenta. Es irreversible, así que se confirma nombrándola —y si
 * dirige alguna iglesia, el servidor la detiene con un 409 hasta que se
 * decide qué pasa con cada una: eliminarla o trasladarla (RFC 0015).
 */
export function DeleteUserDialog({ user, onClose }: DeleteUserDialogProps) {
  const { t } = useTranslation();
  const deleteUser = useDeleteUser(api);
  const [error, setError] = useState<string | null>(null);
  const [ownedChurches, setOwnedChurches] = useState<OwnedChurchImpact[] | null>(null);
  const [decisions, setDecisions] = useState<ChurchDecisions>({});

  const close = () => {
    setError(null);
    setOwnedChurches(null);
    setDecisions({});
    onClose();
  };

  const confirm = () => {
    if (!user) return;

    deleteUser.mutate(
      { id: user.id, churchDecisions: ownedChurches ? toChurchDecisions(decisions) : undefined },
      {
        // Cerrar antes de avisar: el `<dialog>` está en la capa superior del
        // navegador y taparía el aviso.
        onSuccess: () => {
          close();
          toast.success(t('roles.deleted'));
        },
        onError: (cause) => {
          const impacto = ownedChurchesFrom(cause);
          if (impacto) {
            setOwnedChurches(impacto);
            return;
          }

          setError(
            cause instanceof ApiError && cause.status === 400
              ? t('roles.lastAdmin')
              : t('errors.generic'),
          );
        },
      },
    );
  };

  const completa = ownedChurches === null || decisionsComplete(decisions, ownedChurches);
  const enEliminacion = churchesBeingDeleted(decisions);

  return (
    <ConfirmDialog
      open={user !== null}
      onClose={close}
      onConfirm={confirm}
      title={
        ownedChurches
          ? t('roles.ownsChurchesTitle', { count: ownedChurches.length })
          : t('roles.deleteTitle', { name: user?.name ?? '' })
      }
      description={ownedChurches ? t('roles.ownsChurchesBody') : t('roles.deleteBody')}
      confirmLabel={t('roles.deleteUser')}
      destructive
      isPending={deleteUser.isPending}
      error={error}
      confirmDisabled={!completa}
    >
      {ownedChurches && (
        <div className="gap-2.5 max-h-80 flex flex-col overflow-y-auto">
          {ownedChurches.map((church) => (
            <ChurchDecisionRow
              key={church.id}
              church={church}
              action={decisions[church.id]?.action ?? ''}
              targetChurchId={decisions[church.id]?.targetChurchId}
              excludedTargetIds={[church.id, ...enEliminacion]}
              onChange={(decision) => {
                setDecisions((current) => ({ ...current, [church.id]: decision }));
              }}
            />
          ))}
        </div>
      )}
    </ConfirmDialog>
  );
}
