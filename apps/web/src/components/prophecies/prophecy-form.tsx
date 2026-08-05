import { useProphecy } from '@navis/api-client';
import { useTranslation } from 'react-i18next';

import { ProphecyFormBody } from '@/components/prophecies/prophecy-form-body';
import { Dialog } from '@/components/ui/dialog';
import { FormSkeleton } from '@/components/ui/form-skeleton';
import { api } from '@/lib/api';

/**
 * Apuntar o editar una palabra (RFC 0004 §7.7).
 *
 * Al editar recibe **el identificador y no la fila del listado**, y carga la
 * palabra entera: la fila solo trae un extracto del cuerpo, así que guardarla
 * desde ahí recortaría el texto sin avisar.
 *
 * El cuerpo del formulario se monta **cuando ya hay datos**, con `key`: así su
 * estado nace correcto y no hace falta sincronizarlo con un efecto —que además
 * pisaría lo que se esté escribiendo en cada `refetch`—.
 */
export function ProphecyForm({
  open,
  onClose,
  prophecyId,
}: {
  open: boolean;
  onClose: () => void;
  /** Si viene, se edita; si no, se apunta una nueva. */
  prophecyId?: string;
}) {
  const { t } = useTranslation();
  const { data: prophecy } = useProphecy(api, prophecyId ?? '', open && Boolean(prophecyId));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      width="min(42rem, calc(100vw - 2rem))"
      title={prophecyId ? t('prophecies.edit') : t('prophecies.add')}
    >
      {prophecyId && !prophecy ? (
        <FormSkeleton />
      ) : (
        <ProphecyFormBody key={prophecy?.id ?? 'nueva'} prophecy={prophecy} onSaved={onClose} />
      )}
    </Dialog>
  );
}
