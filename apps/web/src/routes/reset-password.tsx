import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, type ResetPasswordInput } from '@navis/shared';
import { CircleCheck, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';

import { AuthLayout } from '@/components/auth/auth-layout';
import { FormError } from '@/components/auth/form-error';
import { PasswordMeter } from '@/components/auth/password-meter';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/ui/password-input';
import { TextLink } from '@/components/ui/text-link';
import { resetPassword } from '@/lib/auth-client';

/**
 * Fija la contraseña nueva (RFC 0023). Se llega aquí desde el enlace del
 * correo: Better Auth ya validó el token por su cuenta y redirigió con
 * `?token=…` — si no viene, o el servidor lo rechaza al enviar, es que ha
 * caducado o ya se usó, y no hay más que ofrecer que pedir uno nuevo.
 */
export function ResetPasswordPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'form' | 'done' | 'invalid'>(token ? 'form' : 'invalid');
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const newPassword = useWatch({ control, name: 'newPassword' });

  const onSubmit = handleSubmit(async (values) => {
    if (!token) return;
    setServerError(null);
    const { error } = await resetPassword({ newPassword: values.newPassword, token });

    if (error) {
      if (error.code === 'INVALID_TOKEN') {
        setStatus('invalid');
        return;
      }
      setServerError(t('errors.generic'));
      return;
    }

    setStatus('done');
  });

  if (status === 'invalid') {
    return (
      <AuthLayout
        title={t('auth.invalidResetToken')}
        subtitle={t('auth.invalidResetTokenDetail')}
        footer={<TextLink to="/forgot-password">{t('auth.requestNewLink')}</TextLink>}
      >
        <div
          aria-hidden
          className="h-14 w-14 rounded-2xl animate-rise-in flex items-center justify-center bg-destructive/10 text-destructive"
        >
          <TriangleAlert size={26} />
        </div>
      </AuthLayout>
    );
  }

  if (status === 'done') {
    return (
      <AuthLayout
        title={t('auth.passwordReset')}
        subtitle={t('auth.signInSubtitle')}
        footer={<TextLink to="/login">{t('auth.backToLogin')}</TextLink>}
      >
        <div
          aria-hidden
          className="h-14 w-14 rounded-2xl animate-rise-in flex items-center justify-center bg-success/10 text-success"
        >
          <CircleCheck size={26} />
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={t('auth.resetPasswordTitle')} subtitle={t('auth.resetPasswordSubtitle')}>
      <form onSubmit={(event) => void onSubmit(event)} className="gap-5 flex flex-col" noValidate>
        <div className="gap-2 flex flex-col">
          <PasswordInput
            label={t('auth.newPassword')}
            autoComplete="new-password"
            hint={t('auth.passwordHint')}
            error={errors.newPassword?.message}
            {...register('newPassword')}
          />
          <PasswordMeter value={newPassword} />
        </div>

        <PasswordInput
          label={t('auth.confirmPassword')}
          autoComplete="new-password"
          // El esquema de `@navis/shared` lleva su mensaje en español de
          // respaldo (Regla 2 §6); aquí solo hay un motivo de error posible
          // para este campo, así que se traduce sin mirar el texto.
          error={errors.confirmPassword && t('auth.passwordsDontMatch')}
          {...register('confirmPassword')}
        />

        <FormError message={serverError} />

        <Button type="submit" size="lg" className="mt-1 w-full" isLoading={isSubmitting}>
          {isSubmitting ? t('auth.resettingPassword') : t('auth.resetPassword')}
        </Button>
      </form>
    </AuthLayout>
  );
}
