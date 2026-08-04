import { useCreateBeliever, useUpdateBeliever } from '@navis/api-client';
import {
  DEFAULT_ALERT_AFTER_DAYS,
  DEFAULT_BELIEVER_STATUS,
  believerName,
  createBelieverSchema,
  type BelieverListItem,
  type Congregation,
  type Gift,
} from '@navis/shared';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { BelieverFields, type BelieverDraft } from '@/components/believers/believer-fields';
import { FormError } from '@/components/auth/form-error';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { formText, optionalText } from '@/lib/form';
import { toast } from '@/lib/toast';

interface FormProps {
  open: boolean;
  onClose: () => void;
  /** Si viene, se edita; si no, se da de alta. */
  believer?: BelieverListItem;
  congregations: readonly Congregation[];
  gifts: readonly Gift[];
}

/**
 * Alta y edición de un hermano (§7.6).
 *
 * El `toast` usa el mismo verbo que el botón: quien pulsa «Añadir hermano» lee
 * «Fulano en la lista», no «Operación completada» (Regla 9 §6).
 */
export function BelieverForm({ open, onClose, believer, congregations, gifts }: FormProps) {
  const { t } = useTranslation();
  const create = useCreateBeliever(api);
  const update = useUpdateBeliever(api);

  const [draft, setDraft] = useState<BelieverDraft>({
    status: believer?.status ?? DEFAULT_BELIEVER_STATUS,
    alertAfterDays: believer ? believer.alertAfterDays : DEFAULT_ALERT_AFTER_DAYS,
    giftIds: believer?.gifts.map((one) => one.id) ?? [],
  });
  const [error, setError] = useState<string | null>(null);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const parsed = createBelieverSchema.safeParse({
      firstName: formText(form.get('firstName')),
      lastName: optionalText(form.get('lastName')),
      phone: optionalText(form.get('phone')),
      congregationId: formText(form.get('congregationId')) || null,
      ...draft,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('errors.validation'));
      return;
    }

    setError(null);
    const failed = () => {
      setError(t('errors.generic'));
    };

    if (believer) {
      update.mutate(
        { id: believer.id, ...parsed.data },
        {
          onSuccess: () => {
            toast.success(t('believers.updated'));
            onClose();
          },
          onError: failed,
        },
      );
      return;
    }

    create.mutate(parsed.data, {
      onSuccess: (created) => {
        toast.success(t('believers.created', { name: believerName(created) }));
        onClose();
      },
      onError: failed,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={believer ? t('believers.editPerson') : t('believers.add')}
    >
      <form onSubmit={submit} className="gap-4 flex flex-col" noValidate>
        <BelieverFields
          believer={believer}
          congregations={congregations}
          gifts={gifts}
          draft={draft}
          onChange={setDraft}
        />

        <FormError message={error} />

        <Button
          type="submit"
          size="lg"
          className="w-full"
          isLoading={create.isPending || update.isPending}
        >
          {believer ? t('common.save') : t('believers.add')}
        </Button>
      </form>
    </Dialog>
  );
}
