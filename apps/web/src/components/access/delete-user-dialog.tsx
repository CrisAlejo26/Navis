import { ApiError, useDeleteUser } from '@navis/api-client';
import type { ManagedUser } from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

interface DeleteUserDialogProps {
  user: ManagedUser | null;
  onClose: () => void;
}

/** Baja de una cuenta. Es irreversible, así que se confirma nombrándola. */
export function DeleteUserDialog({ user, onClose }: DeleteUserDialogProps) {
  const { t } = useTranslation();
  const deleteUser = useDeleteUser(api);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setError(null);
    onClose();
  };

  const confirm = () => {
    if (!user) return;

    deleteUser.mutate(
      { id: user.id },
      {
        // Cerrar antes de avisar: el `<dialog>` está en la capa superior del
        // navegador y taparía el aviso.
        onSuccess: () => {
          close();
          toast.success(t('roles.deleted'));
        },
        onError: (cause) => {
          setError(
            cause instanceof ApiError && cause.status === 400
              ? t('roles.lastAdmin')
              : t('errors.generic'),
          );
        },
      },
    );
  };

  return (
    <ConfirmDialog
      open={user !== null}
      onClose={close}
      onConfirm={confirm}
      title={t('roles.deleteTitle', { name: user?.name ?? '' })}
      description={t('roles.deleteBody')}
      confirmLabel={t('roles.deleteUser')}
      destructive
      isPending={deleteUser.isPending}
      error={error}
    />
  );
}
