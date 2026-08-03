import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@navis/shared';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { AuthLayout } from '@/components/auth/auth-layout';
import { AuthSwitch } from '@/components/auth/auth-switch';
import { FormError } from '@/components/auth/form-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { signIn } from '@/lib/auth-client';

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: true },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const { error } = await signIn.email({
      email: values.email,
      password: values.password,
      rememberMe: values.rememberMe,
    });

    if (error) {
      setServerError(t('auth.invalidCredentials'));
      return;
    }

    await navigate('/', { replace: true });
  });

  return (
    <AuthLayout
      title={t('auth.signInTitle')}
      subtitle={t('auth.signInSubtitle')}
      footer={
        <AuthSwitch question={t('auth.noAccount')} to="/register" action={t('auth.signUp')} />
      }
    >
      <form onSubmit={(event) => void onSubmit(event)} className="gap-5 flex flex-col" noValidate>
        <Input
          label={t('auth.email')}
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <PasswordInput
          label={t('auth.password')}
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />

        <Checkbox label={t('auth.rememberMe')} {...register('rememberMe')} />

        <FormError message={serverError} />

        <Button type="submit" size="lg" className="mt-1 w-full" isLoading={isSubmitting}>
          {isSubmitting ? t('auth.signingIn') : t('auth.signIn')}
        </Button>
      </form>
    </AuthLayout>
  );
}
