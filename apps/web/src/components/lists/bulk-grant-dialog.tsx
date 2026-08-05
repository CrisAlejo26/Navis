import { useBulkGrantList } from '@navis/api-client';
import type { ListCredentialSheetRow } from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { CredentialsPanel } from '@/components/lists/credentials-panel';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { api } from '@/lib/api';

/**
 * **«Dar acceso a los de esta lista»** (RFC 0010 D29).
 *
 * Es un atajo **explícito y confirmado**, no un automatismo: estar en una lista
 * y poder verla siguen siendo cosas distintas (D21). Crea un acceso por persona
 * de las que no tengan ya uno y devuelve la hoja de credenciales, que se dice
 * claro lo que es: un fichero con contraseñas en claro, que se manda y se borra.
 */
export function BulkGrantDialog({
  open,
  onClose,
  listId,
  listName,
  url,
}: {
  open: boolean;
  onClose: () => void;
  listId: string;
  listName: string;
  url: string;
}) {
  const { t } = useTranslation();
  const bulk = useBulkGrantList(api);
  const [hoja, setHoja] = useState<ListCredentialSheetRow[] | null>(null);

  const cerrar = () => {
    setHoja(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={cerrar}
      title={t('lists.grantAllInList')}
      description={hoja ? undefined : t('lists.grantAllExplain')}
      width="min(34rem, calc(100vw - 2rem))"
    >
      {hoja ? (
        <div className="gap-4 flex flex-col">
          {hoja.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('lists.grantAllNobody')}</p>
          ) : (
            <CredentialsPanel rows={hoja} listName={listName} url={url} />
          )}
          <Button size="lg" className="w-full" onClick={cerrar}>
            {t('common.close')}
          </Button>
        </div>
      ) : (
        <div className="gap-3 flex flex-col">
          <Button
            size="lg"
            className="w-full"
            isLoading={bulk.isPending}
            onClick={() => {
              bulk.mutate(listId, { onSuccess: setHoja });
            }}
          >
            {t('lists.grantAllConfirm')}
          </Button>
          <Button variant="ghost" onClick={cerrar}>
            {t('common.cancel')}
          </Button>
        </div>
      )}
    </Dialog>
  );
}
