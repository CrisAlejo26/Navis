import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@navis/shared';
import { MailCheck } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { AuthLayout } from '@/components/auth/auth-layout';
import { FormError } from '@/components/auth/form-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TextLink } from '@/components/ui/text-link';
import { requestPasswordReset } from '@/lib/auth-client';

/**
 * Pide el enlace de recuperación (RFC 0023). El servidor responde igual
 * exista o no la cuenta —Better Auth simula el trabajo para no filtrar
 * quién tiene cuenta—, así que aquí no hay dos ramas de éxito: solo «se ha
 * enviado» o un error de red.
 */
export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const { error } = await requestPasswordReset({
      email: values.email,
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setServerError(t('errors.generic'));
      return;
    }

    setSent(true);
  });

  if (sent) {
    return (
      <AuthLayout
        title={t('auth.resetLinkSent')}
        subtitle={t('auth.resetLinkSentDetail')}
        footer={<TextLink to="/login">{t('auth.backToLogin')}</TextLink>}
      >
        <div
          aria-hidden
          className="h-14 w-14 rounded-2xl animate-rise-in flex items-center justify-center bg-primary/10 text-primary"
        >
          <MailCheck size={26} />
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={t('auth.forgotPasswordTitle')}
      subtitle={t('auth.forgotPasswordSubtitle')}
      footer={<TextLink to="/login">{t('auth.backToLogin')}</TextLink>}
    >
      <form onSubmit={(event) => void onSubmit(event)} className="gap-5 flex flex-col" noValidate>
        <Input
          label={t('auth.email')}
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />

        <FormError message={serverError} />

        <Button type="submit" size="lg" className="mt-1 w-full" isLoading={isSubmitting}>
          {isSubmitting ? t('auth.sendingResetLink') : t('auth.sendResetLink')}
        </Button>
      </form>
    </AuthLayout>
  );
}
