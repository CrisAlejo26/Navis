import { useCreateGift, useUpdateGift } from '@navis/api-client';
import { createGiftSchema, type Gift } from '@navis/shared';
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
export function GiftForm({
  open,
  onClose,
  gift,
}: {
  open: boolean;
  onClose: () => void;
  /** Si viene, se edita; si no, se añade. */
  gift?: Gift;
}) {
  const { t } = useTranslation();
  const create = useCreateGift(api);
  const update = useUpdateGift(api);
  const [accent, setAccent] = useState(gift?.accent ?? '#2140cf');
  const [error, setError] = useState<string | null>(null);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = createGiftSchema.safeParse({
      name: formText(new FormData(event.currentTarget).get('name')),
      accent,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('errors.validation'));
      return;
    }

    setError(null);
    const failed = () => {
      setError(t('gifts.duplicate'));
    };

    if (gift) {
      update.mutate(
        { id: gift.id, ...parsed.data },
        {
          onSuccess: () => {
            toast.success(t('gifts.updated'));
            onClose();
          },
          onError: failed,
        },
      );
      return;
    }

    create.mutate(parsed.data, {
      onSuccess: () => {
        toast.success(t('gifts.created'));
        onClose();
      },
      onError: failed,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} title={gift ? t('gifts.edit') : t('gifts.add')}>
      <form onSubmit={submit} className="gap-4 flex flex-col" noValidate>
        <Input name="name" label={t('gifts.name')} defaultValue={gift?.name} />
        <ColorPicker value={accent} onChange={setAccent} label={t('calendar.congregationColor')} />

        <FormError message={error} />

        <Button
          type="submit"
          size="lg"
          className="w-full"
          isLoading={create.isPending || update.isPending}
        >
          {gift ? t('common.save') : t('gifts.add')}
        </Button>
      </form>
    </Dialog>
  );
}
