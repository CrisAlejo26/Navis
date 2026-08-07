import {
  useCreateBeliever,
  useDeleteBelieverPhoto,
  useMinistries,
  useUpdateBeliever,
  useUploadBelieverPhoto,
} from '@navis/api-client';
import {
  DEFAULT_ALERT_AFTER_DAYS,
  DEFAULT_BELIEVER_STATUS,
  believerName,
  createBelieverSchema,
  type BelieverListItem,
  type Congregation,
  type Gift,
} from '@navis/shared';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { BelieverFields, type BelieverDraft } from '@/components/believers/believer-fields';
import { PhotoField, type PhotoDraft } from '@/components/believers/photo-field';
import { FormError } from '@/components/auth/form-error';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { formText, optionalText } from '@/lib/form';
import { toast } from '@/lib/toast';

interface FormProps {
  open: boolean;
  onClose: () => void;
  /** Si viene, se edita; si no, se da de alta. */
  believer?: BelieverListItem;
  congregations: readonly Congregation[];
  gifts: readonly Gift[];
}

/**
 * Alta y edición de un hermano (§7.6).
 *
 * El `toast` usa el mismo verbo que el botón: quien pulsa «Añadir hermano» lee
 * «Fulano en la lista», no «Operación completada» (Regla 9 §6).
 */
export function BelieverForm({ open, onClose, believer, congregations, gifts }: FormProps) {
  const { t } = useTranslation();
  const create = useCreateBeliever(api);
  const update = useUpdateBeliever(api);
  const uploadPhoto = useUploadBelieverPhoto(api);
  const removePhoto = useDeleteBelieverPhoto(api);

  // El catálogo de labores se pide aquí y no se pasa por props como el de
  // dones: es una consulta cacheada cinco minutos, y hacerla llegar hasta este
  // diálogo cruzando tres pantallas sería ruido en las tres.
  const { data: ministries = [] } = useMinistries(api, open);

  const [draft, setDraft] = useState<BelieverDraft>({
    status: believer?.status ?? DEFAULT_BELIEVER_STATUS,
    alertAfterDays: believer ? believer.alertAfterDays : DEFAULT_ALERT_AFTER_DAYS,
    giftIds: believer?.gifts.map((one) => one.id) ?? [],
    ministries: believer?.ministries ?? [],
    giftDates: { ...(believer?.giftDates ?? {}) },
    ministryDates: { ...(believer?.ministryDates ?? {}) },
    arrivedAt: believer?.arrivedAt ?? null,
    arrivalSite: believer?.arrivalSite ?? null,
    bibleReadings: believer?.bibleReadings ?? null,
    vivenciasReadings: believer?.vivenciasReadings ?? null,
    bibleInstituteTimes: believer?.bibleInstituteTimes ?? null,
  });
  const [photo, setPhoto] = useState<PhotoDraft>({ kind: 'keep' });
  const [error, setError] = useState<string | null>(null);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const parsed = createBelieverSchema.safeParse({
      firstName: formText(form.get('firstName')),
      lastName: optionalText(form.get('lastName')),
      phone: optionalText(form.get('phone')),
      email: optionalText(form.get('email')),
      congregationId: formText(form.get('congregationId')) || null,
      ...draft,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('errors.validation'));
      return;
    }

    setError(null);
    const failed = () => {
      setError(t('errors.generic'));
    };

    /**
     * La foto va **después** de guardar: al crear no hay a quién colgarla, y al
     * editar da igual el orden. Si falla, la persona ya está guardada y solo se
     * pierde la imagen, que es la mitad recuperable de las dos.
     */
    const savePhoto = async (id: string) => {
      if (photo.kind === 'upload') await uploadPhoto.mutateAsync({ id, file: photo.file });
      else if (photo.kind === 'remove') await removePhoto.mutateAsync(id);
    };

    if (believer) {
      update.mutate(
        { id: believer.id, ...parsed.data },
        {
          onSuccess: () => {
            void savePhoto(believer.id).then(() => {
              toast.success(t('believers.updated'));
              onClose();
            });
          },
          onError: failed,
        },
      );
      return;
    }

    create.mutate(parsed.data, {
      onSuccess: (created) => {
        void savePhoto(created.id).then(() => {
          toast.success(t('believers.created', { name: believerName(created) }));
          onClose();
        });
      },
      onError: failed,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={believer ? t('believers.editPerson') : t('believers.add')}
    >
      <form onSubmit={submit} className="gap-4 flex flex-col" noValidate>
        <BelieverFields
          ministries={ministries}
          believer={believer}
          congregations={congregations}
          gifts={gifts}
          draft={draft}
          onChange={setDraft}
        />

        <PhotoField
          believerId={believer?.id}
          hasPhoto={believer?.hasPhoto ?? false}
          value={photo}
          onChange={setPhoto}
        />

        <FormError message={error} />

        <Button
          type="submit"
          size="lg"
          className="w-full"
          isLoading={create.isPending || update.isPending}
        >
          {believer ? t('common.save') : t('believers.add')}
        </Button>
      </form>
    </Dialog>
  );
}
