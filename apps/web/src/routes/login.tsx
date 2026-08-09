import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@navis/shared';
import { useQueryClient } from '@tanstack/react-query';
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
import { signIn, useSession } from '@/lib/auth-client';

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  // `refetch` fuerza la sesión del cliente de Better Auth a ponerse al día; ver
  // el porqué justo donde se usa, más abajo.
  const { refetch: refetchSession } = useSession();
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

    // El store de sesión de Better Auth (nanostores) solo se refresca
    // mientras algo sigue suscrito a `useSession()`; en `/login` no hay nada
    // suscrito, así que tras iniciar sesión se queda con el valor de antes
    // (sin sesión) hasta un `setTimeout(0)` que llega tarde. Sin este
    // `refetchSession()`, `ProtectedRoute` se pintaba una vez con esa sesión
    // vieja, mandaba de vuelta a `/login` y había que volver a escribir las
    // credenciales — intermitente, según lo rápido que se volviera a entrar.
    await refetchSession();

    // Sin esto, quien entra aquí tras cerrar sesión de otra cuenta en el
    // mismo navegador arrastraría en caché sus iglesias, su perfil y sus
    // listados (ninguna clave de `queryKeys` lleva el id de usuario), y
    // `ChurchGate` no se enteraría de que la cuenta nueva no tiene iglesia.
    queryClient.clear();
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
