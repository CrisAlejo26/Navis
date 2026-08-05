import {
  useDeleteListViewer,
  useRegenerateListPassword,
  useSetViewerLists,
  useUpdateListViewer,
} from '@navis/api-client';
import { generateListPassword, type ListSummary, type ListViewer } from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { CredentialsPanel } from '@/components/lists/credentials-panel';
import { GrantCheckboxes } from '@/components/lists/grant-checkboxes';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog } from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

/**
 * El panel de un acceso del directorio (RFC 0010 §8.5, D28, D30).
 *
 * Las casillas escriben **la misma tabla** que la pestaña de compartir, solo que
 * desde el otro lado. Y las tres acciones de abajo dicen lo que hacen antes de
 * hacerlo: regenerar y revocar echan fuera al momento a quien esté dentro.
 */
export function ViewerDetailDialog({
  viewer,
  lists,
  onClose,
}: {
  viewer: ListViewer | null;
  lists: readonly ListSummary[];
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const setLists = useSetViewerLists(api);
  const update = useUpdateListViewer(api);
  const regenerate = useRegenerateListPassword(api);
  const remove = useDeleteListViewer(api);
  const [nueva, setNueva] = useState<string | null>(null);
  const [borrando, setBorrando] = useState(false);

  const cerrar = () => {
    setNueva(null);
    onClose();
  };

  return (
    <>
      <Dialog open={viewer !== null} onClose={cerrar} title={viewer?.label ?? ''}>
        {viewer && (
          <div className="gap-4 flex flex-col">
            <p className="text-sm text-muted-foreground">{viewer.username}</p>

            {nueva ? (
              <CredentialsPanel
                rows={[{ name: viewer.label, username: viewer.username, password: nueva }]}
                listName={t('lists.title')}
                url=""
              />
            ) : (
              <>
                <GrantCheckboxes
                  lists={lists}
                  selected={viewer.listIds}
                  label={t('lists.grantLists')}
                  onChange={(ids) => {
                    setLists.mutate({ id: viewer.id, ids });
                  }}
                />

                <Checkbox
                  checked={viewer.isActive}
                  label={t('lists.active')}
                  onChange={(event) => {
                    update.mutate({ id: viewer.id, isActive: event.target.checked });
                  }}
                />

                <div className="gap-2 pt-2 flex flex-wrap border-t">
                  <Button
                    variant="secondary"
                    size="sm"
                    isLoading={regenerate.isPending}
                    onClick={() => {
                      const password = generateListPassword();
                      regenerate.mutate(
                        { id: viewer.id, password },
                        {
                          onSuccess: () => {
                            setNueva(password);
                            toast.success(t('lists.revokeExplain'));
                          },
                        },
                      );
                    }}
                  >
                    {t('lists.regeneratePassword')}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => {
                      setBorrando(true);
                    }}
                  >
                    {t('lists.revoke')}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Dialog>

      <ConfirmDialog
        open={borrando}
        onClose={() => {
          setBorrando(false);
        }}
        onConfirm={() => {
          if (!viewer) return;
          remove.mutate(viewer.id, {
            onSuccess: () => {
              setBorrando(false);
              cerrar();
              toast.success(t('lists.revoked', { name: viewer.label }));
            },
          });
        }}
        title={t('lists.revoke')}
        description={t('lists.revokeExplain')}
        confirmLabel={t('lists.revoke')}
        destructive
        isPending={remove.isPending}
      />
    </>
  );
}
