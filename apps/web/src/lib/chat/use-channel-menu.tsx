import {
  useArchiveChannel,
  useClearChannelHistory,
  useGlobalArchiveChannel,
  useLeaveChannel,
  useMuteChannel,
} from '@navis/api-client';
import type { ChannelListItem } from '@navis/shared';
import { Archive, ArchiveRestore, BellOff, BellRing, Download, Eraser, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { ChannelMenuDialogsProps } from '@/components/chat/channel-menu-dialogs';
import type { MessageMenuAction } from '@/components/chat/message-menu';
import { api } from '@/lib/api';
import { chatTranscriptLabels } from '@/lib/chat/transcript-labels';
import { exportChat } from '@/lib/export/chat-export';
import { toast } from '@/lib/toast';

/** Nunca vence de verdad: silenciar «para siempre» hasta que se vuelva a activar. */
const MUTE_FOREVER = new Date(8_640_000_000_000_000).toISOString();

/**
 * Las acciones de una conversación — silenciar, archivar, limpiar, salir,
 * exportar —, en un hook para que `ConversationHeader` (dentro del chat) y
 * `ChannelRow` (en la lista, RFC 0019 §1) las compartan sin duplicar la
 * lógica ni las mutaciones (Regla 1 §5). Los dos diálogos de confirmación
 * son harina de otro costal —vista, no lógica— y viven en
 * `ChannelMenuDialogs` (Regla 6).
 */
export function useChannelMenu(
  channel: ChannelListItem,
  currentUserRole: string,
  options: { onAfterAction?: () => void } = {},
): { actions: MessageMenuAction[]; dialogProps: ChannelMenuDialogsProps } {
  const { t } = useTranslation();
  const mute = useMuteChannel(api);
  const archive = useArchiveChannel(api);
  const globalArchive = useGlobalArchiveChannel(api);
  const clear = useClearChannelHistory(api);
  const leave = useLeaveChannel(api);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const isMuted = Boolean(channel.mutedUntil);
  const isArchived = Boolean(channel.archivedAt);
  const canGlobalArchive = currentUserRole === 'pastor' || currentUserRole === 'superadmin';

  const actions: MessageMenuAction[] = [
    {
      id: 'export',
      label: t('communications.exportChat'),
      icon: <Download size={15} aria-hidden />,
      onSelect: () => {
        void exportChat(api, channel, chatTranscriptLabels(t)).catch(() =>
          toast.error(t('errors.generic')),
        );
      },
    },
    {
      id: 'mute',
      label: t(isMuted ? 'communications.unmute' : 'communications.mute'),
      icon: isMuted ? <BellRing size={15} aria-hidden /> : <BellOff size={15} aria-hidden />,
      onSelect: () => {
        mute.mutate({ id: channel.id, until: isMuted ? undefined : MUTE_FOREVER });
      },
    },
    {
      id: 'archive',
      label: t(isArchived ? 'communications.unarchive' : 'communications.archive'),
      icon: isArchived ? (
        <ArchiveRestore size={15} aria-hidden />
      ) : (
        <Archive size={15} aria-hidden />
      ),
      onSelect: () => {
        archive.mutate(
          { id: channel.id, archived: !isArchived },
          { onSuccess: () => options.onAfterAction?.() },
        );
      },
    },
    ...(channel.kind !== 'individual' && canGlobalArchive
      ? [
          {
            id: 'global-archive',
            label: t(channel.isArchived ? 'communications.unarchive' : 'communications.archive'),
            icon: channel.isArchived ? (
              <ArchiveRestore size={15} aria-hidden />
            ) : (
              <Archive size={15} aria-hidden />
            ),
            onSelect: () => {
              globalArchive.mutate({ id: channel.id, archived: !channel.isArchived });
            },
          },
        ]
      : []),
    {
      id: 'clear',
      label: t('communications.clearHistory'),
      icon: <Eraser size={15} aria-hidden />,
      destructive: true,
      onSelect: () => setConfirmClear(true),
    },
    ...(channel.kind !== 'individual'
      ? [
          {
            id: 'leave',
            label: t('communications.leaveGroup'),
            icon: <LogOut size={15} aria-hidden />,
            destructive: true,
            onSelect: () => setConfirmLeave(true),
          },
        ]
      : []),
  ];

  return {
    actions,
    dialogProps: {
      channel,
      confirmClear,
      onCloseClear: () => setConfirmClear(false),
      clear,
      confirmLeave,
      onCloseLeave: () => setConfirmLeave(false),
      leave,
      onAfterLeave: options.onAfterAction,
    },
  };
}
