import { useUpdateListMember } from '@navis/api-client';
import { believerName, type ListMember } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { formText } from '@/lib/form';

/**
 * La nota de una persona **en esta lista**: «Solo primer domingo».
 *
 * No es una nota de la bitácora: aquella es pastoral y privada, y esta puede
 * salir publicada si se activa (RFC 0010 D16). Por eso vive en `list_members` y
 * no en la ficha de la persona.
 */
export function MemberNoteDialog({
  listId,
  member,
  onClose,
}: {
  listId: string;
  member: ListMember | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const update = useUpdateListMember(api);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!member) return;

    const note = formText(new FormData(event.currentTarget).get('note'));

    update.mutate(
      { listId, believerId: member.believerId, note: note || null },
      { onSuccess: onClose },
    );
  };

  return (
    <Dialog
      open={member !== null}
      onClose={onClose}
      title={t('lists.noteFor', { name: member ? believerName(member) : '' })}
      description={t('lists.noteHint')}
    >
      {member && (
        <form onSubmit={submit} className="gap-4 flex flex-col" noValidate>
          <Input
            name="note"
            label={t('lists.note')}
            maxLength={120}
            defaultValue={member.note ?? ''}
          />

          <Button type="submit" size="lg" className="w-full" isLoading={update.isPending}>
            {t('common.save')}
          </Button>
        </form>
      )}
    </Dialog>
  );
}
