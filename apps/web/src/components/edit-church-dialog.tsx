import { useUpdateChurch } from '@navis/api-client';
import type { Church } from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ChurchFormFields } from '@/components/church/church-form-fields';
import { FormError } from '@/components/auth/form-error';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { readChurchForm } from '@/lib/church-form';
import { toast } from '@/lib/toast';

/**
 * La ficha de la iglesia activa, desde la barra lateral.
 *
 * Los campos y su validación son los de `ChurchFormFields` y `readChurchForm`,
 * compartidos con la página de ajustes: aquí solo está el envoltorio de
 * diálogo. Lo que cambia entre los dos sitios es cómo se confirma, no qué se
 * edita.
 */
export function EditChurchDialog({
    church,
    open,
    onClose,
}: {
    church: Church;
    open: boolean;
    onClose: () => void;
}) {
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
                    onClose();
                    toast.success(t('church.updated'));
                },
                onError: () => {
                    setError(t('errors.generic'));
                },
            },
        );
    };

    return (
        <Dialog open={open} onClose={onClose} title={t('church.edit')} description={church.name}>
            <form onSubmit={submit} className="gap-4 flex flex-col" noValidate>
                <ChurchFormFields church={church} />

                <FormError message={error} />

                <div className="mt-1 gap-2 flex justify-end">
                    <Button variant="ghost" onClick={onClose} disabled={updateChurch.isPending}>
                        {t('common.cancel')}
                    </Button>
                    <Button type="submit" isLoading={updateChurch.isPending}>
                        {t('common.save')}
                    </Button>
                </div>
            </form>
        </Dialog>
    );
}
