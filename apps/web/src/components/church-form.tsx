import { useCreateChurch } from '@navis/api-client';
import { createChurchSchema } from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { FormError } from '@/components/auth/form-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { formText } from '@/lib/form';
import { toast } from '@/lib/toast';

/**
 * El alta de una iglesia: **nombre y ciudad**, y ya.
 *
 * Es el mismo formulario en la bienvenida y en el diálogo de «añadir iglesia»,
 * porque es la misma decisión: dónde se va a trabajar. Lo demás —zona horaria,
 * dirección— se ajusta después, cuando ya hay algo dentro.
 */
export function ChurchForm({
  submitLabel,
  onCreated,
}: {
  submitLabel: string;
  onCreated: (name: string) => void;
}) {
  const { t } = useTranslation();
  const createChurch = useCreateChurch(api);
  const [error, setError] = useState<string | null>(null);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const parsed = createChurchSchema.safeParse({
      name: formText(form.get('name')),
      city: formText(form.get('city')),
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('errors.validation'));
      return;
    }

    setError(null);
    createChurch.mutate(parsed.data, {
      onSuccess: (church) => {
        onCreated(church.name);
      },
      onError: () => {
        setError(t('errors.generic'));
        toast.error(t('errors.generic'));
      },
    });
  };

  return (
    <form onSubmit={submit} className="gap-4 flex flex-col" noValidate>
      <Input name="name" label={t('church.name')} autoComplete="organization" />
      <Input name="city" label={t('church.city')} autoComplete="address-level2" />

      <FormError message={error} />

      <Button type="submit" size="lg" className="w-full" isLoading={createChurch.isPending}>
        {submitLabel}
      </Button>
    </form>
  );
}
