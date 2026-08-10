import type { ChannelListItem } from '@navis/shared';
import { BellOff, Paperclip } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router';

import { cn } from '@/lib/cn';
import { formatConversationTime } from '@/lib/format';
import { ChatAvatar } from './avatar';

export function ChannelRow({ channel }: { channel: ChannelListItem }) {
  const { t } = useTranslation();
  const title =
    channel.kind === 'individual' ? (channel.otherMember?.name ?? '') : (channel.name ?? '');
  const avatarId =
    channel.kind === 'individual' ? (channel.otherMember?.id ?? channel.id) : channel.id;
  const avatarImage = channel.kind === 'individual' ? (channel.otherMember?.image ?? null) : null;
  const muted = Boolean(channel.mutedUntil);

  const preview = channel.lastMessage
    ? channel.lastMessage.deletedAt
      ? t('communications.deletedMessage')
      : (channel.lastMessage.body ?? '')
    : '';

  return (
    <NavLink
      to={`/communications/${channel.id}`}
      className={({ isActive }) =>
        cn(
          'gap-3 px-3 py-2.5 flex items-center rounded-lg transition-colors duration-150',
          isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
        )
      }
    >
      {({ isActive }) => (
        <>
          <ChatAvatar id={avatarId} name={title} image={avatarImage} />

          <div className="min-w-0 flex-1">
            <div className="gap-2 flex items-center justify-between">
              <p className="text-sm font-medium truncate">{title}</p>
              {channel.lastMessage && (
                <span
                  className={cn(
                    'shrink-0 text-[11px]',
                    isActive ? 'text-primary-foreground/80' : 'text-muted-foreground',
                  )}
                >
                  {formatConversationTime(channel.lastMessage.createdAt)}
                </span>
              )}
            </div>

            <div className="gap-1.5 flex items-center justify-between">
              <p
                className={cn(
                  'gap-1 text-xs min-w-0 flex items-center truncate',
                  isActive ? 'text-primary-foreground/80' : 'text-muted-foreground',
                )}
              >
                {channel.lastMessage?.hasAttachment && !channel.lastMessage.body && (
                  <Paperclip size={11} aria-hidden className="shrink-0" />
                )}
                <span className="truncate">{preview}</span>
              </p>

              <div className="gap-1 flex shrink-0 items-center">
                {muted && (
                  <BellOff
                    size={12}
                    aria-hidden
                    className={isActive ? 'text-primary-foreground/70' : 'text-muted-foreground'}
                  />
                )}
                {channel.unreadCount > 0 && (
                  <span
                    className={cn(
                      'h-5 min-w-5 px-1.5 font-semibold inline-flex items-center justify-center rounded-full text-[11px]',
                      isActive
                        ? 'bg-primary-foreground text-primary'
                        : 'bg-primary text-primary-foreground',
                    )}
                  >
                    {channel.unreadCount > 99 ? '99+' : channel.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </NavLink>
  );
}
