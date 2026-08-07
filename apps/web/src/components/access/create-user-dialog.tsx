import { ApiError, useCreateUser } from '@navis/api-client';
import { createManagedUserSchema } from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { RoleSelect } from '@/components/access/role-select';
import { FormError } from '@/components/auth/form-error';
import { PasswordMeter } from '@/components/auth/password-meter';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { api } from '@/lib/api';
import { formText } from '@/lib/form';
import { useAssignableRoleBelowLevel } from '@/lib/roles';
import { toast } from '@/lib/toast';
import { errorFor } from '@/lib/user-errors';

/**
 * Alta de una cuenta desde la administración. Se valida con el mismo esquema
 * que usa la API, así que los mensajes salen antes de gastar una petición.
 */
export function CreateUserDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const createUser = useCreateUser(api);
  const belowLevel = useAssignableRoleBelowLevel();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setPassword('');
    setError(null);
    onClose();
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const parsed = createManagedUserSchema.safeParse({
      name: formText(form.get('name')),
      email: formText(form.get('email')),
      password: formText(form.get('password')),
      role: formText(form.get('role')),
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('errors.validation'));
      return;
    }

    setError(null);
    createUser.mutate(parsed.data, {
      onSuccess: () => {
        close();
        toast.success(t('auth.accountCreated'));
      },
      onError: (cause) => {
        setError(cause instanceof ApiError ? errorFor(cause.status, t) : t('errors.generic'));
      },
    });
  };

  return (
    <Dialog open={open} onClose={close} title={t('roles.newUser')}>
      <form onSubmit={submit} className="gap-4 flex flex-col" noValidate>
        <Input name="name" label={t('auth.name')} autoComplete="off" required />
        <Input name="email" type="email" label={t('auth.email')} autoComplete="off" required />

        <div className="gap-2 flex flex-col">
          <PasswordInput
            name="password"
            label={t('auth.password')}
            autoComplete="new-password"
            hint={t('auth.passwordHint')}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
            }}
            required
          />
          <PasswordMeter value={password} />
        </div>

        <RoleSelect
          name="role"
          label={t('roles.role')}
          defaultValue="member"
          belowLevel={belowLevel}
        />

        <FormError message={error} />

        <div className="gap-2 mt-1 flex justify-end">
          <Button variant="ghost" onClick={close} disabled={createUser.isPending}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" isLoading={createUser.isPending}>
            {t('roles.newUser')}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
