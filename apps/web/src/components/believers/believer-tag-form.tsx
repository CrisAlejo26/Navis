import { useCreateBelieverTag, useUpdateBelieverTag } from '@navis/api-client';
import { createBelieverTagSchema, type BelieverTag } from '@navis/shared';
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
 * Alta y edición de una etiqueta del catálogo.
 *
 * El nombre no se traduce: es dato de la iglesia, como el de una sede. El
 * color sale del mismo `ColorPicker`, con la misma paleta: dos paletas serían
 * una que se queda vieja.
 */
export function BelieverTagForm({
  open,
  onClose,
  tag,
}: {
  open: boolean;
  onClose: () => void;
  /** Si viene, se edita; si no, se añade. */
  tag?: BelieverTag;
}) {
  const { t } = useTranslation();
  const create = useCreateBelieverTag(api);
  const update = useUpdateBelieverTag(api);
  const [accent, setAccent] = useState(tag?.accent ?? '#2140cf');
  const [error, setError] = useState<string | null>(null);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = createBelieverTagSchema.safeParse({
      name: formText(new FormData(event.currentTarget).get('name')),
      accent,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('errors.validation'));
      return;
    }

    setError(null);
    const failed = () => {
      setError(t('believerTags.duplicate'));
    };

    if (tag) {
      update.mutate(
        { id: tag.id, ...parsed.data },
        {
          onSuccess: () => {
            toast.success(t('believerTags.updated'));
            onClose();
          },
          onError: failed,
        },
      );
      return;
    }

    create.mutate(parsed.data, {
      onSuccess: () => {
        toast.success(t('believerTags.created'));
        onClose();
      },
      onError: failed,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={tag ? t('believerTags.edit') : t('believerTags.add')}
    >
      <form onSubmit={submit} className="gap-4 flex flex-col" noValidate>
        <Input name="name" label={t('believerTags.name')} defaultValue={tag?.name} required />
        <ColorPicker value={accent} onChange={setAccent} label={t('calendar.congregationColor')} />

        <FormError message={error} />

        <Button
          type="submit"
          size="lg"
          className="w-full"
          isLoading={create.isPending || update.isPending}
        >
          {tag ? t('common.save') : t('believerTags.add')}
        </Button>
      </form>
    </Dialog>
  );
}
