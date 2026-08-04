import { useCreateCongregation, useUpdateCongregation } from '@navis/api-client';
import { CONGREGATION_ACCENTS, createCongregationSchema, type Congregation } from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { FormError } from '@/components/auth/form-error';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { accentStyles } from '@/lib/calendar/accents';
import { api } from '@/lib/api';
import { formText } from '@/lib/form';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/cn';

/**
 * Alta y edición de una sede: **nombre, ciudad y color**.
 *
 * Se crea desde el propio día que se está programando —si costase más que
 * apuntarlo en la hoja de cálculo, nadie lo haría (D11)— y se corrige desde
 * aquí, que es donde uno va cuando se ha equivocado al escribirlo.
 */
export function CongregationForm({
  open,
  onClose,
  congregation,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  /** Si viene, se edita; si no, se crea. */
  congregation?: Congregation;
  onCreated?: (id: string) => void;
}) {
  const { t } = useTranslation();
  const createCongregation = useCreateCongregation(api);
  const updateCongregation = useUpdateCongregation(api);
  const [accent, setAccent] = useState(congregation?.accent);
  const [error, setError] = useState<string | null>(null);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const parsed = createCongregationSchema.safeParse({
      name: formText(form.get('name')),
      city: formText(form.get('city')) || undefined,
      ...(accent ? { accent } : {}),
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('errors.validation'));
      return;
    }

    setError(null);
    const fallo = () => {
      setError(t('calendar.saveFailed'));
    };

    if (congregation) {
      updateCongregation.mutate(
        { id: congregation.id, ...parsed.data },
        {
          onSuccess: (guardada) => {
            toast.success(t('calendar.saved', { name: guardada.name }));
            onClose();
          },
          onError: fallo,
        },
      );
      return;
    }

    createCongregation.mutate(parsed.data, {
      onSuccess: (creada) => {
        toast.success(t('calendar.congregationCreated', { name: creada.name }));
        onCreated?.(creada.id);
        onClose();
      },
      onError: fallo,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={congregation ? t('calendar.editCongregation') : t('calendar.addCongregation')}
    >
      <form onSubmit={submit} className="gap-4 flex flex-col" noValidate>
        <Input
          name="name"
          label={t('calendar.congregationName')}
          defaultValue={congregation?.name}
        />
        <Input
          name="city"
          label={t('calendar.congregationCity')}
          autoComplete="address-level2"
          defaultValue={congregation?.city ?? ''}
        />

        <fieldset className="gap-2 flex flex-col">
          <legend className="text-sm font-medium">{t('calendar.congregationColor')}</legend>
          <div className="gap-2 flex flex-wrap">
            {CONGREGATION_ACCENTS.map((one) => (
              <button
                key={one}
                type="button"
                aria-label={one}
                aria-pressed={one === (accent ?? congregation?.accent)}
                onClick={() => {
                  setAccent(one);
                }}
                className={cn(
                  'h-8 w-8 cursor-pointer rounded-full border-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                  accentStyles(one).rail,
                  one === (accent ?? congregation?.accent)
                    ? 'border-foreground'
                    : 'border-transparent',
                )}
              />
            ))}
          </div>
        </fieldset>

        <FormError message={error} />

        <Button
          type="submit"
          size="lg"
          className="w-full"
          isLoading={createCongregation.isPending || updateCongregation.isPending}
        >
          {congregation ? t('common.save') : t('calendar.addCongregation')}
        </Button>
      </form>
    </Dialog>
  );
}
