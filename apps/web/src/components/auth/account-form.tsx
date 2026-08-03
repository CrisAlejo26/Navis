import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '@navis/shared';
import { useState, type ReactNode } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { FormError } from '@/components/auth/form-error';
import { PasswordMeter } from '@/components/auth/password-meter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';

interface AccountFormProps {
  submitLabel: string;
  submittingLabel: string;
  /** Devuelve el mensaje de error a enseñar, o `null` si ha ido bien. */
  onSubmit: (values: RegisterInput) => Promise<string | null>;
  /** Contenido propio de cada pantalla, entre los campos y el botón. */
  children?: ReactNode;
}

/**
 * El formulario de crear cuenta. Lo comparten el alta normal y el primer
 * arranque, que solo se diferencian en el texto y en a dónde envían: los
 * campos, la política de contraseña y el medidor son los mismos, y así siguen
 * siéndolo (Regla 1).
 */
export function AccountForm({
  submitLabel,
  submittingLabel,
  onSubmit,
  children,
}: AccountFormProps) {
  const { t } = useTranslation();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  // `useWatch` y no `watch()`: la segunda devuelve una función nueva en cada
  // render que el compilador de React no puede memoizar.
  const password = useWatch({ control, name: 'password' });

  const submit = handleSubmit(async (values) => {
    setServerError(null);
    setServerError(await onSubmit(values));
  });

  return (
    <form onSubmit={(event) => void submit(event)} className="gap-5 flex flex-col" noValidate>
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

      <div className="gap-2 flex flex-col">
        <PasswordInput
          label={t('auth.password')}
          autoComplete="new-password"
          hint={t('auth.passwordHint')}
          error={errors.password?.message}
          {...register('password')}
        />
        <PasswordMeter value={password} />
      </div>

      {children}

      <FormError message={serverError} />

      <Button type="submit" size="lg" className="mt-1 w-full" isLoading={isSubmitting}>
        {isSubmitting ? submittingLabel : submitLabel}
      </Button>
    </form>
  );
}
