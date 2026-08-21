import { useCreateTeaching, useUpdateTeaching } from '@navis/api-client';
import {
  createTeachingSchema,
  EMPTY_TEACHING_BODY,
  type Teaching,
  type TeachingBody,
} from '@navis/shared';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { FormError } from '@/components/auth/form-error';
import { TeachingFields } from '@/components/teachings/teaching-fields';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { formText } from '@/lib/form';
import { toast } from '@/lib/toast';

/**
 * Los campos y el envío, ya con la enseñanza cargada (si se está editando).
 *
 * Separado de `TeachingForm` para que su estado **nazca correcto**: el padre
 * lo monta con `key` cuando llegan los datos (CLAUDE.md).
 */
export function TeachingFormBody({
  teaching,
  onSaved,
}: {
  teaching?: Teaching;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const create = useCreateTeaching(api);
  const update = useUpdateTeaching(api);

  const [body, setBody] = useState<TeachingBody>(teaching?.body ?? EMPTY_TEACHING_BODY);
  const [error, setError] = useState<string | null>(null);

  const title = useRef<HTMLInputElement>(null);
  useEffect(() => {
    title.current?.focus();
  }, []);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const parsed = createTeachingSchema.safeParse({
      title: formText(form.get('title')),
      body,
      receivedAt: formText(form.get('receivedAt')),
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('errors.validation'));
      return;
    }

    setError(null);
    const guardar = teaching
      ? update.mutateAsync({ id: teaching.id, ...parsed.data })
      : create.mutateAsync(parsed.data);

    void guardar
      .then(() => {
        toast.success(teaching ? t('teachings.updated') : t('teachings.created'));
        onSaved();
      })
      .catch(() => {
        setError(t('errors.generic'));
      });
  };

  return (
    <form onSubmit={submit} className="gap-4 min-w-0 flex flex-col" noValidate>
      <TeachingFields teaching={teaching} titleRef={title} body={body} onBodyChange={setBody} />
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
