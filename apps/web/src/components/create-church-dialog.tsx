import { useTranslation } from 'react-i18next';

import { ChurchForm } from '@/components/church-form';
import { Dialog } from '@/components/ui/dialog';
import { toast } from '@/lib/toast';

/**
 * Añadir otra iglesia desde el selector. La recién creada queda activa —la ha
 * creado para trabajar en ella—, así que al cerrar ya se está dentro.
 */
export function CreateChurchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose} title={t('church.add')} description={t('church.addHint')}>
      <ChurchForm
        submitLabel={t('church.create')}
        onCreated={(name) => {
          // Se cierra antes de avisar: el `<dialog>` vive en la capa superior
          // del navegador y taparía el aviso mientras siga abierto.
          onClose();
          toast.success(t('church.created', { name }));
        }}
      />
    </Dialog>
  );
}
