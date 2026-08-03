import { ApiError, useCreateFirstAdmin } from '@navis/api-client';
import type { RegisterInput } from '@navis/shared';
import { ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { AccountForm } from '@/components/auth/account-form';
import { AuthLayout } from '@/components/auth/auth-layout';
import { Note } from '@/components/ui/note';
import { api } from '@/lib/api';
import { useEnterApp } from '@/lib/enter-app';

/**
 * Primer arranque: la instalación no tiene ninguna cuenta y la primera será la
 * administradora. Solo se llega aquí a través de SetupGate, que lo comprueba
 * contra la API; en cuanto existe una cuenta, esta ruta redirige al login.
 */
export function SetupPage() {
  const { t } = useTranslation();
  const enterApp = useEnterApp();
  const createAdmin = useCreateFirstAdmin(api);

  const handleSubmit = async (values: RegisterInput): Promise<string | null> => {
    try {
      await createAdmin.mutateAsync(values);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) return t('setup.alreadyDone');
      return t(error instanceof ApiError ? error.i18nKey : 'errors.generic');
    }

    // La cuenta ya existe: se entra por el camino normal, el mismo que usa
    // cualquiera desde el login.
    return enterApp(values.email, values.password);
  };

  return (
    <AuthLayout
      eyebrow={t('setup.eyebrow')}
      title={t('setup.title')}
      subtitle={t('setup.subtitle')}
    >
      <AccountForm
        submitLabel={t('setup.submit')}
        submittingLabel={t('setup.submitting')}
        onSubmit={handleSubmit}
      >
        <Note icon={ShieldCheck} title={t('setup.roleBadge')}>
          {t('setup.roleBadgeHint')}
        </Note>
      </AccountForm>
    </AuthLayout>
  );
}
