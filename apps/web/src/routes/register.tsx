import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '@navis/shared';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';

import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { signUp } from '@/lib/auth-client';

export function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', name: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const { error } = await signUp.email(values);

    if (error) {
      setServerError(error.message ?? t('errors.generic'));
      return;
    }

    // `autoSignIn: true` en la API deja la sesión lista tras registrarse.
    await navigate('/', { replace: true });
  });

  return (
    <main className="p-6 flex min-h-dvh flex-col items-center justify-center">
      <Card className="max-w-sm w-full">
        <CardTitle>{t('auth.signUp')}</CardTitle>
        <CardDescription className="mb-5">{t('home.subtitle')}</CardDescription>

        <form onSubmit={(event) => void onSubmit(event)} className="gap-4 flex flex-col" noValidate>
          <Input
            label={t('auth.name')}
            autoComplete="name"
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            label={t('auth.email')}
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label={t('auth.password')}
            type="password"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register('password')}
          />

          {serverError && (
            <p role="alert" className="text-sm text-destructive">
              {serverError}
            </p>
          )}

          <Button type="submit" disabled={isSubmitting}>
            {t('auth.signUp')}
          </Button>
        </form>

        <p className="mt-4 text-sm text-muted-foreground">
          {t('auth.haveAccount')}{' '}
          <Link to="/login" className="text-primary underline">
            {t('auth.signIn')}
          </Link>
        </p>
      </Card>
    </main>
  );
}
