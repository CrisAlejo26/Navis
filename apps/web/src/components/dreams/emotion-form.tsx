import { useCreateEmotion } from '@navis/api-client';
import { createEmotionSchema } from '@navis/shared';
import { Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { FormError } from '@/components/auth/form-error';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/ui/color-picker';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { formText } from '@/lib/form';
import { toast } from '@/lib/toast';

/** Con el que nace una emoción nueva: el azul de siempre, y se cambia. */
const DEFAULT_ACCENT = 'primary';

/**
 * Crear una emoción propia (RFC 0005 D6).
 *
 * El color sale del mismo selector que las sedes y los dones —veintidós
 * muestras y la rueda del sistema— y no de una lista nueva: es la misma
 * decisión y la misma paleta (Regla 1, D7).
 */
export function EmotionForm() {
  const { t } = useTranslation();
  const create = useCreateEmotion(api);
  const [accent, setAccent] = useState<string>(DEFAULT_ACCENT);
  const [error, setError] = useState<string | null>(null);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const parsed = createEmotionSchema.safeParse({
      name: formText(new FormData(form).get('name')),
      accent,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('errors.validation'));
      return;
    }

    setError(null);
    void create
      .mutateAsync(parsed.data)
      .then(() => {
        toast.success(t('dreams.emotionCreated'));
        form.reset();
        setAccent(DEFAULT_ACCENT);
      })
      .catch(() => {
        setError(t('errors.generic'));
      });
  };

  return (
    <form
      onSubmit={submit}
      className="gap-3 p-3 flex flex-col rounded-lg border bg-muted/40"
      noValidate
    >
      <Input
        name="name"
        label={t('dreams.emotionName')}
        placeholder={t('dreams.emotionNamePlaceholder')}
        required
      />

      <ColorPicker value={accent} onChange={setAccent} label={t('dreams.emotionColor')} />

      <FormError message={error} />

      <Button type="submit" size="md" className="self-start" isLoading={create.isPending}>
        <Plus size={15} aria-hidden />
        {t('dreams.emotionAdd')}
      </Button>
    </form>
  );
}
