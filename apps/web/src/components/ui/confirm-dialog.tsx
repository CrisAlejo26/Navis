import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { FormError } from '@/components/auth/form-error';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  /** Texto del botón que ejecuta la acción; nombra la acción, no dice «Sí». */
  confirmLabel: string;
  /** En rojo cuando lo que se va a hacer no se puede deshacer. */
  destructive?: boolean;
  isPending?: boolean;
  error?: string | null;
  /**
   * Un paso intermedio entre la descripción y los botones —el reparto de
   * iglesias de la RFC 0015, por ejemplo—. Sin esto, cada confirmación con
   * algo que decidir tendría que dejar de usar `ConfirmDialog` entero.
   */
  children?: ReactNode;
  /** El paso intermedio puede dejar la decisión a medias; el botón lo refleja. */
  confirmDisabled?: boolean;
}

/**
 * Confirmación de una acción importante o destructiva.
 *
 * El botón dice lo que va a pasar («Eliminar la cuenta»), no «Aceptar»: es lo
 * último que se lee antes de que ocurra y tiene que nombrar el resultado.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  destructive = false,
  isPending = false,
  error,
  children,
  confirmDisabled = false,
}: ConfirmDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose} title={title} description={description}>
      <div className="gap-3 flex flex-col">
        {children}
        <FormError message={error} />
        <div className="gap-2 flex justify-end">
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            {t('common.cancel')}
          </Button>
          <Button
            variant={destructive ? 'destructive' : 'primary'}
            onClick={onConfirm}
            isLoading={isPending}
            disabled={confirmDisabled || isPending}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
