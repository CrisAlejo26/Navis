import {
  useArchiveChannel,
  useClearChannelHistory,
  useGlobalArchiveChannel,
  useLeaveChannel,
  useMuteChannel,
} from '@navis/api-client';
import type { ChannelDetail } from '@navis/shared';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import { ChatAvatar } from './avatar';
import { MessageMenu, type MessageMenuAction } from './message-menu';

/** Nunca vence de verdad: silenciar «para siempre» hasta que se vuelva a activar. */
const MUTE_FOREVER = new Date(8_640_000_000_000_000).toISOString();

export function ConversationHeader({
  channel,
  currentUserRole,
  typingName,
}: {
  channel: ChannelDetail;
  currentUserRole: string;
  typingName: string | null;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const mute = useMuteChannel(api);
  const archive = useArchiveChannel(api);
  const globalArchive = useGlobalArchiveChannel(api);
  const clear = useClearChannelHistory(api);
  const leave = useLeaveChannel(api);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const title =
    channel.kind === 'individual' ? (channel.otherMember?.name ?? '') : (channel.name ?? '');
  const isMuted = Boolean(channel.mutedUntil);
  const isArchived = Boolean(channel.archivedAt);
  const canGlobalArchive = currentUserRole === 'pastor' || currentUserRole === 'superadmin';

  const subtitle = typingName
    ? t('communications.typing')
    : channel.kind === 'individual'
      ? channel.otherMember?.email
      : t('communications.groupMembers') + ` · ${String(channel.memberCount)}`;

  const actions: MessageMenuAction[] = [
    {
      id: 'mute',
      label: t(isMuted ? 'communications.unmute' : 'communications.mute'),
      icon: null,
      onSelect: () => {
        mute.mutate({ id: channel.id, until: isMuted ? undefined : MUTE_FOREVER });
      },
    },
    {
      id: 'archive',
      label: t(isArchived ? 'communications.unarchive' : 'communications.archive'),
      icon: null,
      onSelect: () => {
        archive.mutate(
          { id: channel.id, archived: !isArchived },
          { onSuccess: () => void navigate('/communications') },
        );
      },
    },
    ...(channel.kind !== 'individual' && canGlobalArchive
      ? [
          {
            id: 'global-archive',
            label: t(channel.isArchived ? 'communications.unarchive' : 'communications.archive'),
            icon: null,
            onSelect: () => {
              globalArchive.mutate({ id: channel.id, archived: !channel.isArchived });
            },
          },
        ]
      : []),
    {
      id: 'clear',
      label: t('communications.clearHistory'),
      icon: null,
      destructive: true,
      onSelect: () => setConfirmClear(true),
    },
    ...(channel.kind !== 'individual'
      ? [
          {
            id: 'leave',
            label: t('communications.leaveGroup'),
            icon: null,
            destructive: true,
            onSelect: () => setConfirmLeave(true),
          },
        ]
      : []),
  ];

  return (
    <div className="h-16 px-4 gap-3 flex shrink-0 items-center border-b bg-card">
      <Link
        to="/communications"
        aria-label={t('common.back')}
        className="h-9 w-9 -ml-1.5 md:hidden inline-flex shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <ArrowLeft size={18} aria-hidden />
      </Link>

      <ChatAvatar id={channel.id} name={title} />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold truncate">{title}</p>
        {subtitle && (
          <p
            className={
              typingName
                ? 'text-xs truncate text-primary'
                : 'text-xs truncate text-muted-foreground'
            }
          >
            {subtitle}
          </p>
        )}
      </div>

      <MessageMenu actions={actions} />

      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={() => {
          clear.mutate(channel.id, {
            onSuccess: () => {
              setConfirmClear(false);
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
        onClose={() => setConfirmLeave(false)}
        onConfirm={() => {
          leave.mutate(channel.id, {
            onSuccess: () => {
              setConfirmLeave(false);
              toast.success(t('communications.leaveGroup'));
              void navigate('/communications');
            },
          });
        }}
        title={t('communications.leaveGroup')}
        description={channel.name ?? ''}
        confirmLabel={t('communications.leaveGroup')}
        destructive
        isPending={leave.isPending}
      />
    </div>
  );
}
