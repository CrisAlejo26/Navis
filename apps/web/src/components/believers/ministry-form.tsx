import { useCreateMinistry, useUpdateMinistry } from '@navis/api-client';
import { createMinistrySchema, type MinistryCatalog } from '@navis/shared';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { FormError } from '@/components/auth/form-error';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/ui/color-picker';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { formText } from '@/lib/form';
import { toast } from '@/lib/toast';

/**
 * Alta y edición de un don del catálogo (D5).
 *
 * El nombre no se traduce: es dato de la iglesia, como el de una sede (D6). El
 * color sale del mismo `ColorPicker`, con la misma paleta: dos paletas serían
 * una que se queda vieja.
 */
export function MinistryForm({
  open,
  onClose,
  ministry,
}: {
  open: boolean;
  onClose: () => void;
  /** Si viene, se edita; si no, se añade. */
  ministry?: MinistryCatalog;
}) {
  const { t } = useTranslation();
  const create = useCreateMinistry(api);
  const update = useUpdateMinistry(api);
  const [accent, setAccent] = useState(ministry?.accent ?? '#2140cf');
  const [error, setError] = useState<string | null>(null);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = createMinistrySchema.safeParse({
      name: formText(new FormData(event.currentTarget).get('name')),
      accent,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('errors.validation'));
      return;
    }

    setError(null);
    const failed = () => {
      setError(t('ministries.duplicate'));
    };

    if (ministry) {
      update.mutate(
        { id: ministry.id, ...parsed.data },
        {
          onSuccess: () => {
            toast.success(t('ministries.updated'));
            onClose();
          },
          onError: failed,
        },
      );
      return;
    }

    create.mutate(parsed.data, {
      onSuccess: () => {
        toast.success(t('ministries.created'));
        onClose();
      },
      onError: failed,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={ministry ? t('ministries.edit') : t('ministries.add')}
    >
      <form onSubmit={submit} className="gap-4 flex flex-col" noValidate>
        <Input name="name" label={t('ministries.name')} defaultValue={ministry?.name} />
        <ColorPicker value={accent} onChange={setAccent} label={t('calendar.congregationColor')} />

        <FormError message={error} />

        <Button
          type="submit"
          size="lg"
          className="w-full"
          isLoading={create.isPending || update.isPending}
        >
          {ministry ? t('common.save') : t('ministries.add')}
        </Button>
      </form>
    </Dialog>
  );
}
