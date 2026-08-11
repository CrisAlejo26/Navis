import type { ChannelDetail } from '@navis/shared';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';

import { useChannelMenu } from '@/lib/chat/use-channel-menu';
import { ChatAvatar } from './avatar';
import { ChannelMenuDialogs } from './channel-menu-dialogs';
import { MessageMenu } from './message-menu';

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
  const { actions, dialogProps } = useChannelMenu(channel, currentUserRole, {
    onAfterAction: () => void navigate('/communications'),
  });

  const title =
    channel.kind === 'individual' ? (channel.otherMember?.name ?? '') : (channel.name ?? '');

  const subtitle = typingName
    ? t('communications.typing')
    : channel.kind === 'individual'
      ? channel.otherMember?.email
      : t('communications.groupMembers') + ` · ${String(channel.memberCount)}`;

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

      <ChannelMenuDialogs {...dialogProps} />
    </div>
  );
}
