import { useDream } from '@navis/api-client';
import { useTranslation } from 'react-i18next';

import { DreamFormBody } from '@/components/dreams/dream-form-body';
import { Dialog } from '@/components/ui/dialog';
import { FormSkeleton } from '@/components/ui/form-skeleton';
import { api } from '@/lib/api';

/**
 * Apuntar o editar un sueño (RFC 0005 §7.7).
 *
 * Al editar recibe **el identificador y no la fila del listado**, y carga el
 * sueño entero: la fila solo trae un extracto del cuerpo, así que guardarla
 * desde ahí recortaría el texto sin avisar.
 *
 * El cuerpo del formulario se monta **cuando ya hay datos**, con `key`: así su
 * estado nace correcto y no hace falta sincronizarlo con un efecto.
 */
export function DreamForm({
  open,
  onClose,
  dreamId,
}: {
  open: boolean;
  onClose: () => void;
  /** Si viene, se edita; si no, se apunta uno nuevo. */
  dreamId?: string;
}) {
  const { t } = useTranslation();
  const { data: dream } = useDream(api, dreamId ?? '', open && Boolean(dreamId));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      width="min(42rem, calc(100vw - 2rem))"
      title={dreamId ? t('dreams.edit') : t('dreams.add')}
    >
      {dreamId && !dream ? (
        <FormSkeleton />
      ) : (
        <DreamFormBody key={dream?.id ?? 'nuevo'} dream={dream} onSaved={onClose} />
      )}
    </Dialog>
  );
}
