import { useUpdateChurch } from '@navis/api-client';
import { updateChurchSchema, type Church } from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { FormError } from '@/components/auth/form-error';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { TimezoneSelect } from '@/components/ui/timezone-select';
import { api } from '@/lib/api';
import { formText } from '@/lib/form';
import { toast } from '@/lib/toast';

/**
 * La ficha de la iglesia activa. El identificador no está: se derivó del nombre
 * al crearla y no cambia (ver `ChurchesService.update`).
 */
export function EditChurchDialog({
  church,
  open,
  onClose,
}: {
  church: Church;
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const updateChurch = useUpdateChurch(api);
  const [error, setError] = useState<string | null>(null);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const parsed = updateChurchSchema.safeParse({
      name: formText(form.get('name')),
      city: formText(form.get('city')),
      timezone: formText(form.get('timezone')),
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('errors.validation'));
      return;
    }

    setError(null);
    updateChurch.mutate(
      { id: church.id, ...parsed.data },
      {
        onSuccess: () => {
          onClose();
          toast.success(t('church.updated'));
        },
        onError: () => {
          setError(t('errors.generic'));
        },
      },
    );
  };

  return (
    <Dialog open={open} onClose={onClose} title={t('church.edit')} description={church.name}>
      <form onSubmit={submit} className="gap-4 flex flex-col" noValidate>
        <Input name="name" label={t('church.name')} defaultValue={church.name} autoComplete="off" />
        <Input
          name="city"
          label={t('church.city')}
          defaultValue={church.city ?? ''}
          autoComplete="off"
        />
        <TimezoneSelect
          name="timezone"
          label={t('profile.timezone')}
          defaultValue={church.timezone}
        />

        <FormError message={error} />

        <div className="mt-1 gap-2 flex justify-end">
          <Button variant="ghost" onClick={onClose} disabled={updateChurch.isPending}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" isLoading={updateChurch.isPending}>
            {t('common.save')}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
