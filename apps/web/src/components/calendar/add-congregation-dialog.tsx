import { useCreateCongregation } from '@navis/api-client';
import { createCongregationSchema } from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { FormError } from '@/components/auth/form-error';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { formText } from '@/lib/form';
import { toast } from '@/lib/toast';

/**
 * Alta de una sede: **nombre y ciudad**, desde el propio día que se está
 * programando. Si crear el sitio donde se reúnen costase más que apuntarlo en
 * la hoja de cálculo, nadie lo haría (RFC 0002 D11).
 *
 * El color no se pregunta: el servidor coge el primero libre, y se cambia
 * después desde los ajustes si hace falta.
 */
export function AddCongregationDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: (id: string) => void;
}) {
  const { t } = useTranslation();
  const createCongregation = useCreateCongregation(api);
  const [error, setError] = useState<string | null>(null);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const parsed = createCongregationSchema.safeParse({
      name: formText(form.get('name')),
      city: formText(form.get('city')) || undefined,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('errors.validation'));
      return;
    }

    setError(null);
    createCongregation.mutate(parsed.data, {
      onSuccess: (congregation) => {
        toast.success(t('calendar.congregationCreated', { name: congregation.name }));
        onCreated?.(congregation.id);
        onClose();
      },
      onError: () => {
        setError(t('errors.generic'));
      },
    });
  };

  return (
    <Dialog open={open} onClose={onClose} title={t('calendar.addCongregation')}>
      <form onSubmit={submit} className="gap-4 flex flex-col" noValidate>
        <Input name="name" label={t('calendar.congregationName')} />
        <Input name="city" label={t('calendar.congregationCity')} autoComplete="address-level2" />

        <FormError message={error} />

        <Button type="submit" size="lg" className="w-full" isLoading={createCongregation.isPending}>
          {t('calendar.addCongregation')}
        </Button>
      </form>
    </Dialog>
  );
}
