import type { Message, MessageAttachment } from '@navis/shared';
import { attachmentPath } from '@navis/shared';
import {
  Download,
  FileText,
  Forward,
  Pencil,
  Reply as ReplyIcon,
  SmilePlus,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatBytes, formatTime } from '@/lib/format';
import { ChatAvatar } from './avatar';
import { MessageMenu, type MessageMenuAction } from './message-menu';
import { MessageStatus, type MessageStatusState } from './message-status';
import { ReactionPicker } from './reaction-picker';

function groupReactions(
  reactions: Message['reactions'],
  userId: string,
): { emoji: string; count: number; mine: boolean }[] {
  const map = new Map<string, { count: number; mine: boolean }>();
  for (const reaction of reactions) {
    const entry = map.get(reaction.emoji) ?? { count: 0, mine: false };
    entry.count += 1;
    if (reaction.userId === userId) entry.mine = true;
    map.set(reaction.emoji, entry);
  }
  return [...map.entries()].map(([emoji, info]) => ({ emoji, ...info }));
}

function AttachmentView({ attachment, own }: { attachment: MessageAttachment; own: boolean }) {
  const url = `${api.baseUrl}${attachmentPath(attachment.id)}`;

  if (attachment.kind === 'imagen') {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="mb-1.5 block">
        <img
          src={url}
          alt={attachment.originalName}
          crossOrigin="use-credentials"
          className="max-h-72 max-w-full rounded-lg object-cover"
        />
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'mb-1.5 p-2.5 gap-2.5 flex items-center rounded-lg border transition-colors',
        own
          ? 'border-primary-foreground/25 hover:bg-primary-foreground/10'
          : 'border-border hover:bg-background/60',
      )}
    >
      <FileText size={22} aria-hidden className="shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="text-sm block truncate">{attachment.originalName}</span>
        <span className="text-xs block opacity-75">{formatBytes(attachment.sizeBytes)}</span>
      </span>
      <Download size={16} aria-hidden className="shrink-0" />
    </a>
  );
}

export function MessageBubble({
  message,
  isOwn,
  showAuthor,
  status,
  currentUserId,
  onReply,
  onForward,
  onEdit,
  onDelete,
  onToggleReaction,
}: {
  message: Message;
  isOwn: boolean;
  showAuthor: boolean;
  status?: MessageStatusState;
  currentUserId: string;
  onReply: () => void;
  onForward: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleReaction: (emoji: string, mine: boolean) => void;
}) {
  const { t } = useTranslation();
  const [picking, setPicking] = useState(false);
  const deleted = Boolean(message.deletedAt);
  const reactions = groupReactions(message.reactions, currentUserId);

  const actions: MessageMenuAction[] = deleted
    ? []
    : [
        {
          id: 'reply',
          label: t('communications.reply'),
          icon: <ReplyIcon size={15} aria-hidden />,
          onSelect: onReply,
        },
        {
          id: 'forward',
          label: t('communications.forwardTo'),
          icon: <Forward size={15} aria-hidden />,
          onSelect: onForward,
        },
        ...(isOwn
          ? [
              {
                id: 'edit',
                label: t('common.edit'),
                icon: <Pencil size={15} aria-hidden />,
                onSelect: onEdit,
              },
              {
                id: 'delete',
                label: t('communications.deleteMessage'),
                icon: <Trash2 size={15} aria-hidden />,
                onSelect: onDelete,
                destructive: true,
              },
            ]
          : []),
      ];

  return (
    <div className={cn('group px-1 gap-2 flex', isOwn ? 'flex-row-reverse' : 'flex-row')}>
      {!isOwn &&
        (showAuthor ? (
          <ChatAvatar
            id={message.authorId}
            name={message.authorName}
            image={message.authorImage}
            size="sm"
          />
        ) : (
          <div className="w-8 shrink-0" aria-hidden />
        ))}

      <div
        className={cn(
          'gap-1 flex max-w-[min(30rem,80%)] flex-col',
          isOwn ? 'items-end' : 'items-start',
        )}
      >
        {!isOwn && showAuthor && (
          <span className="px-1 text-xs font-medium text-muted-foreground">
            {message.authorName}
          </span>
        )}

        <div className="gap-1 flex items-end">
          {isOwn && <MessageMenu actions={actions} />}

          <div
            className={cn(
              'rounded-2xl px-3.5 py-2.5',
              deleted
                ? 'border border-dashed text-muted-foreground italic'
                : isOwn
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground',
            )}
          >
            {!deleted && message.forwardedFrom && (
              <p className="mb-1 text-xs opacity-75">{t('communications.forwarded')}</p>
            )}
            {!deleted && message.replyTo && (
              <div
                className={cn(
                  'mb-1.5 px-2 py-1 text-xs border-l-2 opacity-80',
                  isOwn ? 'border-primary-foreground/50' : 'border-primary',
                )}
              >
                <p className="font-medium">{message.replyTo.authorName}</p>
                <p className="line-clamp-1">
                  {message.replyTo.deletedAt
                    ? t('communications.deletedMessage')
                    : message.replyTo.body}
                </p>
              </div>
            )}

            {deleted ? (
              <p className="text-sm">{t('communications.deletedMessage')}</p>
            ) : (
              <>
                {message.attachments.map((attachment) => (
                  <AttachmentView key={attachment.id} attachment={attachment} own={isOwn} />
                ))}
                {message.body && (
                  <p className="leading-relaxed text-[15px] break-words whitespace-pre-wrap">
                    {message.body}
                  </p>
                )}
              </>
            )}
          </div>

          {!isOwn && <MessageMenu actions={actions} />}
        </div>

        {!deleted && (
          <div className="gap-1.5 px-1 relative flex items-center">
            <button
              type="button"
              onClick={() => {
                setPicking((previous) => !previous);
              }}
              aria-label={t('communications.react')}
              className="text-muted-foreground opacity-0 transition-opacity duration-150 group-hover:opacity-100 hover:text-foreground focus-visible:opacity-100"
            >
              <SmilePlus size={13} aria-hidden />
            </button>
            {picking && (
              <ReactionPicker
                className={cn('mt-1 absolute top-full z-20', isOwn ? 'right-0' : 'left-0')}
                onSelect={(emoji) => {
                  onToggleReaction(emoji, false);
                  setPicking(false);
                }}
              />
            )}
            {message.editedAt && (
              <span className="text-[11px] text-muted-foreground">
                {t('communications.edited')}
              </span>
            )}
            <span className="text-[11px] text-muted-foreground">
              {formatTime(message.createdAt)}
            </span>
            {isOwn && status && (
              <MessageStatus state={status} time={formatTime(message.createdAt)} />
            )}
          </div>
        )}

        {reactions.length > 0 && (
          <div className="gap-1 px-1 flex flex-wrap">
            {reactions.map(({ emoji, count, mine }) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  onToggleReaction(emoji, mine);
                }}
                className={cn(
                  'gap-1 px-2 py-0.5 text-xs inline-flex items-center rounded-full border',
                  mine ? 'border-primary bg-primary/10' : 'border-border bg-muted',
                )}
              >
                <span>{emoji}</span>
                <span className="tabular-nums">{count}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
