import { useUpdateDream } from '@navis/api-client';
import { todayIn, type Dream } from '@navis/shared';
import { useState, type FormEvent } from 'react';
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
 * Marcar un sueño como cumplido: **la fecha y qué significó, a la vez** (D10).
 *
 * Los dos juntos y no un interruptor a secas: el día en que pasó sin lo que
 * quiso decir es media anotación, y es justo la mitad que se olvida. Por eso
 * este diálogo sustituye a la tercera área de texto que traía el plan.
 *
 * La fecha se propone hoy y **no admite ser anterior a la noche** (D12): el
 * `min` lo dice antes de enviar y el servidor lo vuelve a comprobar.
 */
export function FulfillDialog({
  dream,
  open,
  onClose,
}: {
  dream: Dream;
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const update = useUpdateDream(api);
  const [error, setError] = useState<string | null>(null);

  const today = todayIn(Intl.DateTimeFormat().resolvedOptions().timeZone);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const fulfilledAt = formText(form.get('fulfilledAt'));

    if (fulfilledAt < dream.dreamedAt) {
      setError(t('dreams.errorOrder'));
      return;
    }

    setError(null);
    void update
      .mutateAsync({
        id: dream.id,
        fulfilledAt,
        fulfillmentMeaning: formText(form.get('fulfillmentMeaning')) || null,
      })
      .then(() => {
        toast.success(t('dreams.markedFulfilled'));
        onClose();
      })
      .catch(() => {
        setError(t('errors.generic'));
      });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      width="min(32rem, calc(100vw - 2rem))"
      title={t('dreams.fulfillTitle')}
      description={t('dreams.fulfillHint')}
    >
      <form onSubmit={submit} className="gap-4 min-w-0 flex flex-col" noValidate>
        <div className="sm:max-w-56">
          <Input
            name="fulfilledAt"
            type="date"
            label={t('dreams.fulfilledAt')}
            min={dream.dreamedAt}
            defaultValue={dream.fulfilledAt ?? today}
            required
          />
        </div>

        <Textarea
          name="fulfillmentMeaning"
          rows={6}
          label={t('dreams.meaning')}
          placeholder={t('dreams.meaningPlaceholder')}
          defaultValue={dream.fulfillmentMeaning ?? ''}
        />

        <FormError message={error} />

        <Button type="submit" size="lg" className="w-full" isLoading={update.isPending}>
          {t('common.save')}
        </Button>
      </form>
    </Dialog>
  );
}
