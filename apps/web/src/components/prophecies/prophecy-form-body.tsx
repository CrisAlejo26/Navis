import { useCreateProphecy, useUpdateProphecy } from '@navis/api-client';
import { createProphecySchema, type Prophecy } from '@navis/shared';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { FormError } from '@/components/auth/form-error';
import { FulfilledSwitch, type FulfilledDraft } from '@/components/prophecies/fulfilled-switch';
import { ProphecyFields } from '@/components/prophecies/prophecy-fields';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { formText } from '@/lib/form';
import { toast } from '@/lib/toast';

/**
 * Los campos y el envío, ya con la palabra cargada (si se está editando).
 *
 * Está separado de `ProphecyForm` para que su estado **nazca correcto**: lo
 * monta el padre con `key` cuando llegan los datos, así que el interruptor de
 * cumplida se inicializa de una vez y no hay que sincronizarlo con un efecto.
 */
export function ProphecyFormBody({
  prophecy,
  onSaved,
}: {
  prophecy?: Prophecy;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const create = useCreateProphecy(api);
  const update = useUpdateProphecy(api);

  const [fulfilled, setFulfilled] = useState<FulfilledDraft>({
    at: prophecy?.fulfilledAt ?? '',
  });
  const [error, setError] = useState<string | null>(null);

  // El título se lleva el foco al montar. Con `ref` y no con `autoFocus`:
  // dentro de un `<dialog>` modal el foco lo reparte el navegador al abrirlo.
  const title = useRef<HTMLInputElement>(null);
  useEffect(() => {
    title.current?.focus();
  }, []);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const parsed = createProphecySchema.safeParse({
      title: formText(form.get('title')),
      body: formText(form.get('body')),
      receivedAt: formText(form.get('receivedAt')),
      fulfilledAt: fulfilled.at || undefined,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('errors.validation'));
      return;
    }

    setError(null);
    const guardar = prophecy
      ? update.mutateAsync({
          id: prophecy.id,
          ...parsed.data,
          // Al editar, quitar la fecha tiene que viajar como `null`:
          // `undefined` querría decir «no la toques» (D6).
          fulfilledAt: parsed.data.fulfilledAt ?? null,
        })
      : create.mutateAsync(parsed.data);

    void guardar
      .then(() => {
        toast.success(prophecy ? t('prophecies.updated') : t('prophecies.created'));
        onSaved();
      })
      .catch(() => {
        setError(t('errors.generic'));
      });
  };

  return (
    <form onSubmit={submit} className="gap-4 min-w-0 flex flex-col" noValidate>
      <ProphecyFields prophecy={prophecy} titleRef={title} />
      <FulfilledSwitch value={fulfilled} onChange={setFulfilled} />
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
  );
}
