import { ApiError, useDeleteRole } from '@navis/api-client';
import type { RoleRow } from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { api } from '@/lib/api';
import { useRoleLabel } from '@/lib/roles';
import { toast } from '@/lib/toast';

/** Baja de un rol propio. Solo se puede si no lo tiene ninguna cuenta. */
export function DeleteRoleDialog({ role, onClose }: { role: RoleRow | null; onClose: () => void }) {
  const { t } = useTranslation();
  const label = useRoleLabel();
  const deleteRole = useDeleteRole(api);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setError(null);
    onClose();
  };

  const confirm = () => {
    if (!role) return;

    deleteRole.mutate(
      { id: role.id },
      {
        onSuccess: () => {
          close();
          toast.success(t('roles.roleDeleted'));
        },
        onError: (cause) => {
          if (cause instanceof ApiError && cause.status === 409) setError(t('roles.roleInUse'));
          else setError(t('errors.generic'));
        },
      },
    );
  };

  return (
    <ConfirmDialog
      open={role !== null}
      onClose={close}
      onConfirm={confirm}
      title={t('roles.deleteRoleTitle', { name: role ? label(role) : '' })}
      description={t('roles.deleteRoleBody')}
      confirmLabel={t('roles.deleteRole')}
      destructive
      isPending={deleteRole.isPending}
      error={error}
    />
  );
}
