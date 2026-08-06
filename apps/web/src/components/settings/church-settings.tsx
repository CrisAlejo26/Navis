import { useUpdateChurch } from '@navis/api-client';
import type { Church } from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ChurchFormFields } from '@/components/church/church-form-fields';
import { FormError } from '@/components/auth/form-error';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/api';
import { readChurchForm } from '@/lib/church-form';
import { toast } from '@/lib/toast';

/**
 * La ficha de la iglesia en ajustes.
 *
 * Es el mismo formulario del diálogo de la barra lateral, pero aquí se lee sin
 * prisa y al lado de los ajustes que dependen de él —la zona horaria manda en
 * el calendario—, que es donde se busca cuando no se está cambiando el nombre a
 * toda prisa.
 *
 * Solo escribe quien puede administrar iglesias; el resto lo ve y no lo toca.
 */
export function ChurchSettings({ church, canEdit }: { church: Church; canEdit: boolean }) {
  const { t } = useTranslation();
  const updateChurch = useUpdateChurch(api);
  const [error, setError] = useState<string | null>(null);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const leído = readChurchForm(new FormData(event.currentTarget));
    if (!leído.ok) {
      setError(leído.message ?? t('errors.validation'));
      return;
    }

    setError(null);
    updateChurch.mutate(
      { id: church.id, ...leído.data },
      {
        onSuccess: () => {
          toast.success(t('church.updated'));
        },
        onError: () => {
          setError(t('errors.generic'));
        },
      },
    );
  };

  return (
    <Card>
      <form onSubmit={submit} className="gap-4 flex flex-col" noValidate>
        <fieldset disabled={!canEdit} className="gap-4 flex flex-col">
          <ChurchFormFields church={church} />
        </fieldset>

        <FormError message={error} />

        {canEdit && (
          <div className="flex justify-end">
            <Button type="submit" isLoading={updateChurch.isPending}>
              {t('common.save')}
            </Button>
          </div>
        )}
      </form>
    </Card>
  );
}
