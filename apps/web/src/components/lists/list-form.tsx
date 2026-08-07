import { useCreateList, useUpdateList } from '@navis/api-client';
import { ACCENT_PALETTE, createListSchema, type List } from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { FormError } from '@/components/auth/form-error';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/ui/color-picker';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import { formText } from '@/lib/form';
import { toast } from '@/lib/toast';

/**
 * Alta y edición de una lista (RFC 0010).
 *
 * El **color** no es decoración: es lo que dice de qué lista estás hablando en
 * la portada, en la ficha, en el cartel público y en el punto que sale junto a
 * un nombre en creyentes (D37). Por eso se elige aquí y no en un ajuste
 * escondido.
 */
export function ListForm({
  open,
  onClose,
  list,
}: {
  open: boolean;
  onClose: () => void;
  /** Si viene, se edita; si no, se crea. */
  list?: List;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createList = useCreateList(api);
  const updateList = useUpdateList(api);
  const [error, setError] = useState<string | null>(null);
  const [accent, setAccent] = useState(list?.accent ?? ACCENT_PALETTE[0]);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const parsed = createListSchema.safeParse({
      name: formText(form.get('name')),
      description: formText(form.get('description')),
      accent,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('errors.validation'));
      return;
    }

    setError(null);
    const onError = () => {
      setError(t('lists.saveFailed'));
    };

    if (list) {
      updateList.mutate(
        { id: list.id, ...parsed.data },
        {
          onSuccess: (guardada) => {
            toast.success(t('lists.saved', { name: guardada.name }));
            onClose();
          },
          onError,
        },
      );
      return;
    }

    createList.mutate(parsed.data, {
      onSuccess: (creada) => {
        toast.success(t('lists.created', { name: creada.name }));
        onClose();
        void navigate(`/lists/${creada.slug}`);
      },
      onError,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} title={list ? t('lists.edit') : t('lists.add')}>
      <form onSubmit={submit} className="gap-4 flex flex-col" noValidate>
        <Input name="name" label={t('lists.name')} defaultValue={list?.name} required />

        <Textarea
          name="description"
          rows={2}
          label={t('lists.description')}
          hint={t('lists.descriptionHint')}
          defaultValue={list?.description ?? ''}
        />

        <ColorPicker value={accent} onChange={setAccent} label={t('lists.color')} />

        <FormError message={error} />

        <Button
          type="submit"
          size="lg"
          className="w-full"
          isLoading={createList.isPending || updateList.isPending}
        >
          {list ? t('common.save') : t('lists.add')}
        </Button>
      </form>
    </Dialog>
  );
}
