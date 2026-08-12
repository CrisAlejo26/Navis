import { useCreateTag, useUpdateTag } from '@navis/api-client';
import { createTagSchema, DEFAULT_TASK_ICON, type Tag } from '@navis/shared';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { IconPicker } from '@/components/tasks/icon-picker';
import { FormError } from '@/components/auth/form-error';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/ui/color-picker';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { formText } from '@/lib/form';
import { toast } from '@/lib/toast';

/** Crear o editar una etiqueta (RFC 0018 §7): nombre, icono y color. */
export function TagForm({ tag, onSaved }: { tag?: Tag; onSaved: () => void }) {
  const { t } = useTranslation();
  const create = useCreateTag(api);
  const update = useUpdateTag(api);

  const [icon, setIcon] = useState(tag?.icon ?? DEFAULT_TASK_ICON);
  const [accent, setAccent] = useState(tag?.accent ?? '#2140cf');
  const [error, setError] = useState<string | null>(null);

  const nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const parsed = createTagSchema.safeParse({ name: formText(form.get('name')), icon, accent });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('errors.validation'));
      return;
    }

    setError(null);
    const save = tag
      ? update.mutateAsync({ id: tag.id, ...parsed.data })
      : create.mutateAsync(parsed.data);

    void save
      .then(() => {
        toast.success(tag ? t('tasks.tagUpdated') : t('tasks.tagCreated'));
        onSaved();
      })
      .catch(() => {
        setError(t('errors.generic'));
      });
  };

  return (
    <form onSubmit={submit} className="gap-4 min-w-0 flex flex-col">
      <Input
        ref={nameRef}
        name="name"
        label={t('tasks.tagName')}
        placeholder={t('tasks.tagNamePlaceholder')}
        defaultValue={tag?.name}
        required
        maxLength={40}
      />

      <IconPicker value={icon} onChange={setIcon} />
      <ColorPicker value={accent} onChange={setAccent} label={t('tasks.tagColor')} />

      <FormError message={error} />

      <Button type="submit" isLoading={create.isPending || update.isPending}>
        {t('common.save')}
      </Button>
    </form>
  );
}
