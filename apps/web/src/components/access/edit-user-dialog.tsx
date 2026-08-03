import { ApiError, useUpdateUser } from '@navis/api-client';
import type { ManagedUser } from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { RoleSelect } from '@/components/access/role-select';
import { FormError } from '@/components/auth/form-error';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { formText } from '@/lib/form';
import { toast } from '@/lib/toast';

interface EditUserDialogProps {
  user: ManagedUser | null;
  onClose: () => void;
}

/** Nombre, correo y rol de una cuenta. Nada se guarda sin pulsar «Guardar». */
export function EditUserDialog({ user, onClose }: EditUserDialogProps) {
  const { t } = useTranslation();
  const updateUser = useUpdateUser(api);
  const [error, setError] = useState<string | null>(null);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    const form = new FormData(event.currentTarget);
    setError(null);

    updateUser.mutate(
      {
        id: user.id,
        name: formText(form.get('name')),
        email: formText(form.get('email')),
        role: formText(form.get('role')) || user.role,
      },
      {
        // Se cierra antes de avisar: el `<dialog>` vive en la capa superior del
        // navegador y taparía el aviso mientras siga abierto.
        onSuccess: () => {
          onClose();
          toast.success(t('roles.saved'));
        },
        onError: (cause) => {
          setError(
            cause instanceof ApiError && cause.status === 409
              ? t('auth.emailTaken')
              : t('errors.generic'),
          );
        },
      },
    );
  };

  return (
    <Dialog
      open={user !== null}
      onClose={onClose}
      title={t('roles.editUser')}
      description={user?.email}
    >
      {user && (
        <form onSubmit={submit} className="gap-4 flex flex-col" noValidate>
          <Input name="name" label={t('auth.name')} defaultValue={user.name} required />
          <Input
            name="email"
            type="email"
            label={t('auth.email')}
            defaultValue={user.email}
            required
          />
          <RoleSelect name="role" label={t('roles.role')} defaultValue={user.role} />

          <FormError message={error} />

          <div className="gap-2 mt-1 flex justify-end">
            <Button variant="ghost" onClick={onClose} disabled={updateUser.isPending}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" isLoading={updateUser.isPending}>
              {t('common.save')}
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
