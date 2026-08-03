import type { RegisterInput } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { AccountForm } from '@/components/auth/account-form';
import { AuthLayout } from '@/components/auth/auth-layout';
import { AuthSwitch } from '@/components/auth/auth-switch';
import { signUp } from '@/lib/auth-client';
import { useEnterApp } from '@/lib/enter-app';

export function RegisterPage() {
  const { t } = useTranslation();
  const enterApp = useEnterApp();

  const handleSubmit = async (values: RegisterInput): Promise<string | null> => {
    const { error } = await signUp.email(values);

    if (error) {
      // Better Auth devuelve el mensaje en inglés; el caso que de verdad se da
      // tiene su propia clave y el resto cae en el genérico (Regla 2).
      return error.code === 'USER_ALREADY_EXISTS' ? t('auth.emailTaken') : t('errors.generic');
    }

    return enterApp(values.email, values.password);
  };

  return (
    <AuthLayout
      title={t('auth.signUpTitle')}
      subtitle={t('auth.signUpSubtitle')}
      footer={<AuthSwitch question={t('auth.haveAccount')} to="/login" action={t('auth.signIn')} />}
    >
      <AccountForm
        submitLabel={t('auth.signUp')}
        submittingLabel={t('auth.creatingAccount')}
        onSubmit={handleSubmit}
      />
    </AuthLayout>
  );
}
