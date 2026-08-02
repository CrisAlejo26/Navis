import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@pastortools/shared';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';

import { LanguageSelect } from '@/components/language-select';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6">
      <Card className="w-full max-w-sm">
        <CardTitle>{t('auth.signIn')}</CardTitle>
        <CardDescription className="mb-5">{t('home.subtitle')}</CardDescription>

        <form onSubmit={(event) => void onSubmit(event)} className="flex flex-col gap-4" noValidate>
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
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />

          <label className="text-muted-foreground flex items-center gap-2 text-sm">
            <input type="checkbox" {...register('rememberMe')} />
            {t('auth.rememberMe')}
          </label>

          {serverError && (
            <p role="alert" className="text-destructive text-sm">
              {serverError}
            </p>
          )}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t('auth.signingIn') : t('auth.signIn')}
          </Button>
        </form>

        <p className="text-muted-foreground mt-4 text-sm">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="text-primary underline">
            {t('auth.signUp')}
          </Link>
        </p>
      </Card>

      <div className="flex items-center gap-4">
        <ThemeToggle />
        <LanguageSelect />
      </div>
    </main>
  );
}
