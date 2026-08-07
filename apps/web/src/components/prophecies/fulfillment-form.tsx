import { useCreateFulfillment, useUpdateFulfillment } from '@navis/api-client';
import { createFulfillmentSchema, toIsoDate, type ProphecyFulfillment } from '@navis/shared';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { FormError } from '@/components/auth/form-error';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import { formText } from '@/lib/form';
import { toast } from '@/lib/toast';

/**
 * Anotar una parte que ya se ha cumplido (RFC 0004 D4, §7.7).
 *
 * Dos campos y nada más: qué parte y cuándo. El texto se lleva el foco porque
 * es a lo que se viene; la fecha se propone con hoy.
 */
export function FulfillmentForm({
  open,
  onClose,
  prophecyId,
  fulfillment,
}: {
  open: boolean;
  onClose: () => void;
  prophecyId: string;
  /** Si viene, se edita; si no, se anota uno nuevo. */
  fulfillment?: ProphecyFulfillment;
}) {
  const { t } = useTranslation();
  const create = useCreateFulfillment(api);
  const update = useUpdateFulfillment(api);
  const [error, setError] = useState<string | null>(null);

  const text = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (open) text.current?.focus();
  }, [open]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const parsed = createFulfillmentSchema.safeParse({
      text: formText(form.get('text')),
      occurredAt: formText(form.get('occurredAt')),
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('errors.validation'));
      return;
    }

    setError(null);
    const guardar = fulfillment
      ? update.mutateAsync({ prophecyId, id: fulfillment.id, ...parsed.data })
      : create.mutateAsync({ prophecyId, ...parsed.data });

    void guardar
      .then(() => {
        toast.success(
          fulfillment ? t('prophecies.fulfillmentUpdated') : t('prophecies.fulfillmentAdded'),
        );
        onClose();
      })
      .catch(() => {
        // El servidor rechaza una fecha anterior a la de recepción (D7); es el
        // único error propio que puede dar este formulario.
        setError(t('prophecies.errorBefore'));
      });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      width="min(34rem, calc(100vw - 2rem))"
      title={fulfillment ? t('prophecies.editFulfillment') : t('prophecies.addFulfillment')}
    >
      <form onSubmit={submit} className="gap-4 min-w-0 flex flex-col" noValidate>
        <Textarea
          ref={text}
          name="text"
          rows={6}
          label={t('prophecies.fulfillmentText')}
          placeholder={t('prophecies.fulfillmentTextPlaceholder')}
          defaultValue={fulfillment?.text}
          required
        />

        <div className="sm:max-w-56">
          <Input
            name="occurredAt"
            type="date"
            label={t('prophecies.fulfillmentDate')}
            defaultValue={fulfillment?.occurredAt ?? toIsoDate(new Date())}
            required
          />
        </div>

        <FormError message={error} />

        <Button
          type="submit"
          size="lg"
          className="w-full"
          isLoading={create.isPending || update.isPending}
        >
          {t('common.save')}
        </Button>
      </form>
    </Dialog>
  );
}
