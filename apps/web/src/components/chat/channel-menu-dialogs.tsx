import type { ChannelListItem } from '@navis/shared';
import type { UseMutationResult } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from '@/lib/toast';

export interface ChannelMenuDialogsProps {
  channel: ChannelListItem;
  confirmClear: boolean;
  onCloseClear: () => void;
  clear: UseMutationResult<void, Error, string>;
  confirmLeave: boolean;
  onCloseLeave: () => void;
  leave: UseMutationResult<void, Error, string>;
  onAfterLeave?: () => void;
}

/** Las dos confirmaciones de `useChannelMenu`: limpiar historial y salir del grupo. */
export function ChannelMenuDialogs({
  channel,
  confirmClear,
  onCloseClear,
  clear,
  confirmLeave,
  onCloseLeave,
  leave,
  onAfterLeave,
}: ChannelMenuDialogsProps) {
  const { t } = useTranslation();

  return (
    <>
      <ConfirmDialog
        open={confirmClear}
        onClose={onCloseClear}
        onConfirm={() => {
          clear.mutate(channel.id, {
            onSuccess: () => {
              onCloseClear();
              toast.success(t('communications.clearHistory'));
            },
          });
        }}
        title={t('communications.clearHistory')}
        description={t('communications.clearHistoryConfirm')}
        confirmLabel={t('communications.clearHistory')}
        destructive
        isPending={clear.isPending}
      />

      <ConfirmDialog
        open={confirmLeave}
        onClose={onCloseLeave}
        onConfirm={() => {
          leave.mutate(channel.id, {
            onSuccess: () => {
              onCloseLeave();
              toast.success(t('communications.leaveGroup'));
              onAfterLeave?.();
            },
          });
        }}
        title={t('communications.leaveGroup')}
        description={channel.name ?? ''}
        confirmLabel={t('communications.leaveGroup')}
        destructive
        isPending={leave.isPending}
      />
    </>
  );
}
