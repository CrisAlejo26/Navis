import { useUpdateProphecy } from '@navis/api-client';
import { toIsoDate, type Prophecy } from '@navis/shared';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { FormError } from '@/components/auth/form-error';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { formText } from '@/lib/form';
import { toast } from '@/lib/toast';

/**
 * Marcar una profecía como cumplida **sin abrir el formulario entero**
 * (RFC 0004 §7.6).
 *
 * Un solo campo: la fecha, con hoy puesto. Es la acción que más se hace desde
 * la ficha —se entra justo a eso— y hacerla pasar por el diálogo de edición,
 * con su título y sus doce filas de texto, era pedir cuatro pasos para uno.
 */
export function MarkFulfilledDialog({
  prophecy,
  onClose,
}: {
  prophecy: Prophecy | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const update = useUpdateProphecy(api);
  const [error, setError] = useState<string | null>(null);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!prophecy) return;

    const fulfilledAt = formText(new FormData(event.currentTarget).get('fulfilledAt'));
    if (fulfilledAt < prophecy.receivedAt) {
      setError(t('prophecies.errorOrder'));
      return;
    }

    setError(null);
    update.mutate(
      { id: prophecy.id, fulfilledAt },
      {
        onSuccess: () => {
          toast.success(t('prophecies.markedFulfilled'));
          onClose();
        },
        onError: () => {
          setError(t('errors.generic'));
        },
      },
    );
  };

  return (
    <Dialog
      open={Boolean(prophecy)}
      onClose={onClose}
      width="min(26rem, calc(100vw - 2rem))"
      title={t('prophecies.markFulfilled')}
      description={prophecy?.title}
    >
      <form onSubmit={submit} className="gap-4 flex flex-col" noValidate>
        <Input
          name="fulfilledAt"
          type="date"
          label={t('prophecies.fulfilledAt')}
          defaultValue={toIsoDate(new Date())}
          min={prophecy?.receivedAt}
          required
        />

        <FormError message={error} />

        <Button type="submit" size="lg" className="w-full" isLoading={update.isPending}>
          {t('common.save')}
        </Button>
      </form>
    </Dialog>
  );
}
