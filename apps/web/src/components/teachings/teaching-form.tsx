import { useTeaching } from '@navis/api-client';
import { useTranslation } from 'react-i18next';

import { TeachingFormBody } from '@/components/teachings/teaching-form-body';
import { Dialog } from '@/components/ui/dialog';
import { FormSkeleton } from '@/components/ui/form-skeleton';
import { api } from '@/lib/api';

/**
 * Anotar o editar una enseñanza (RFC 0022 §6).
 *
 * Al editar recibe el identificador y no la fila del listado: la fila solo
 * trae un extracto (CLAUDE.md).
 */
export function TeachingForm({
  open,
  onClose,
  teachingId,
}: {
  open: boolean;
  onClose: () => void;
  /** Si viene, se edita; si no, se anota una nueva. */
  teachingId?: string;
}) {
  const { t } = useTranslation();
  const { data: teaching } = useTeaching(api, teachingId ?? '', open && Boolean(teachingId));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      width="min(42rem, calc(100vw - 2rem))"
      title={teachingId ? t('teachings.edit') : t('teachings.add')}
    >
      {teachingId && !teaching ? (
        <FormSkeleton />
      ) : (
        <TeachingFormBody key={teaching?.id ?? 'nueva'} teaching={teaching} onSaved={onClose} />
      )}
    </Dialog>
  );
}
