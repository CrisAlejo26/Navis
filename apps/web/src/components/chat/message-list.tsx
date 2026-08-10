import type { ChannelDetail, Message } from '@navis/shared';
import {
  useDeleteMessage,
  useMessages,
  useReactToMessage,
  useRemoveReaction,
} from '@navis/api-client';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { usePollFallback } from '@/lib/chat/chat-socket-hooks';
import { DayDivider } from './day-divider';
import { MessageBubble } from './message-bubble';
import type { MessageStatusState } from './message-status';

const dayKey = (iso: string): string => iso.slice(0, 10);

/** Leído si alguna otra cuenta del canal ha llegado hasta este mensaje o más allá. */
function statusOf(
  message: Message,
  channel: ChannelDetail,
  currentUserId: string,
): MessageStatusState {
  const read = channel.members.some(
    (member) => member.userId !== currentUserId && member.lastReadAt >= message.createdAt,
  );
  return read ? 'read' : 'delivered';
}

/**
 * El historial de la conversación abierta (RFC 0016 §6, §11).
 *
 * «Ver mensajes anteriores» es un botón, no un `IntersectionObserver`: así se
 * puede activar con teclado (D11, como `useBelieverNotes`).
 */
export function MessageList({
  channel,
  currentUserId,
  onReply,
  onForward,
  onEdit,
}: {
  channel: ChannelDetail;
  currentUserId: string;
  onReply: (message: Message) => void;
  onForward: (message: Message) => void;
  onEdit: (message: Message) => void;
}) {
  const { t } = useTranslation();
  const query = useMessages(api, channel.id, true, usePollFallback());
  const react = useReactToMessage(api);
  const unreact = useRemoveReaction(api);
  const remove = useDeleteMessage(api);
  const bottomRef = useRef<HTMLDivElement>(null);
  const loadedOnce = useRef(false);

  const items = [...(query.data?.pages ?? [])].reverse().flatMap((page) => page.items);
  const lastId = items[items.length - 1]?.id;

  // Baja al fondo la primera vez que carga, y cada vez que llega un mensaje
  // nuevo (el propio hilo crece hacia abajo, como cualquier chat).
  useEffect(() => {
    if (query.isLoading) return;
    if (!loadedOnce.current || lastId) bottomRef.current?.scrollIntoView({ block: 'end' });
    loadedOnce.current = true;
  }, [query.isLoading, lastId]);

  if (query.isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">{t('common.loading')}</div>;
  }

  return (
    <div className="p-4 gap-0.5 flex flex-1 flex-col overflow-y-auto">
      {query.hasNextPage && (
        <div className="pb-3 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            isLoading={query.isFetchingNextPage}
            onClick={() => void query.fetchNextPage()}
          >
            {t('communications.loadOlder')}
          </Button>
        </div>
      )}

      {items.length === 0 && (
        <div className="text-sm flex flex-1 items-center justify-center text-center text-muted-foreground">
          {t('communications.noMessages')}
        </div>
      )}

      {items.map((message, index) => {
        const previousDay = index > 0 ? dayKey(items[index - 1]?.createdAt ?? '') : null;
        const divider = dayKey(message.createdAt) !== previousDay;
        const isOwn = message.authorId === currentUserId;

        return (
          <div key={message.id} className="py-0.5">
            {divider && <DayDivider date={message.createdAt} />}
            <MessageBubble
              message={message}
              isOwn={isOwn}
              showAuthor={channel.kind !== 'individual' && !isOwn}
              status={isOwn ? statusOf(message, channel, currentUserId) : undefined}
              currentUserId={currentUserId}
              onReply={() => onReply(message)}
              onForward={() => onForward(message)}
              onEdit={() => onEdit(message)}
              onDelete={() => remove.mutate(message.id)}
              onToggleReaction={(emoji, mine) => {
                if (mine) unreact.mutate({ id: message.id, emoji });
                else react.mutate({ id: message.id, emoji });
              }}
            />
          </div>
        );
      })}

      <div ref={bottomRef} />
    </div>
  );
}
