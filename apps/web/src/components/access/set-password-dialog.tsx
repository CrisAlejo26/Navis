import { useSetUserPassword } from '@navis/api-client';
import { passwordSchema, type ManagedUser } from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { FormError } from '@/components/auth/form-error';
import { PasswordMeter } from '@/components/auth/password-meter';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { PasswordInput } from '@/components/ui/password-input';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

interface SetPasswordDialogProps {
  user: ManagedUser | null;
  onClose: () => void;
}

/**
 * Contraseña nueva puesta por un administrador. Cierra las sesiones abiertas
 * de esa persona, así que se avisa al terminar.
 */
export function SetPasswordDialog({ user, onClose }: SetPasswordDialogProps) {
  const { t } = useTranslation();
  const setPassword = useSetUserPassword(api);
  const [password, setPasswordValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setPasswordValue('');
    setError(null);
    onClose();
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('errors.validation'));
      return;
    }

    setError(null);
    setPassword.mutate(
      { id: user.id, password },
      {
        // Cerrar antes de avisar: el `<dialog>` está en la capa superior del
        // navegador y taparía el aviso.
        onSuccess: () => {
          close();
          toast.success(t('roles.passwordChanged'));
        },
        onError: () => {
          setError(t('errors.generic'));
        },
      },
    );
  };

  return (
    <Dialog
      open={user !== null}
      onClose={close}
      title={t('roles.changePassword')}
      description={user?.email}
    >
      <form onSubmit={submit} className="gap-4 flex flex-col" noValidate>
        <div className="gap-2 flex flex-col">
          <PasswordInput
            name="password"
            label={t('roles.newPassword')}
            autoComplete="new-password"
            hint={t('auth.passwordHint')}
            value={password}
            onChange={(event) => {
              setPasswordValue(event.target.value);
            }}
          />
          <PasswordMeter value={password} />
        </div>

        <FormError message={error} />

        <div className="gap-2 mt-1 flex justify-end">
          <Button variant="ghost" onClick={close} disabled={setPassword.isPending}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" isLoading={setPassword.isPending}>
            {t('roles.changePassword')}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
