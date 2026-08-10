import { useChannel, useMarkChannelRead } from '@navis/api-client';
import { TYPING_EXPIRES_MS, type Message } from '@navis/shared';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router';

import { Composer } from '@/components/chat/composer';
import { ConversationHeader } from '@/components/chat/conversation-header';
import { ForwardMessageDialog } from '@/components/chat/forward-message-dialog';
import { MessageList } from '@/components/chat/message-list';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { api } from '@/lib/api';
import { useSession } from '@/lib/auth-client';
import { useChatSocketContext } from '@/lib/chat/chat-socket-hooks';

/**
 * `key={channelId}` en vez de un efecto que resetea `replyTo`/`editing` al
 * cambiar de conversación: el componente nace limpio en cada canal, como ya
 * hace `ProphecyFormBody` (CLAUDE.md).
 */
export function ConversationPage() {
  const { channelId = '' } = useParams();
  return <ConversationView key={channelId} channelId={channelId} />;
}

function ConversationView({ channelId }: { channelId: string }) {
  const { data: session } = useSession();
  const currentUserId = session?.user.id ?? '';
  const currentUserRole = session?.user.role ?? 'creyente';

  const { data: channel, isLoading } = useChannel(api, channelId);
  const markRead = useMarkChannelRead(api);
  const socket = useChatSocketContext();

  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editing, setEditing] = useState<Message | null>(null);
  const [forwarding, setForwarding] = useState<Message | null>(null);
  const [typingName, setTypingName] = useState<string | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!channelId) return;
    socket.joinChannel(channelId);
    markRead.mutate(channelId);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al abrir el canal, no en cada render de `markRead`
  }, [channelId, socket]);

  useEffect(() => {
    return socket.onTyping((event) => {
      if (event.channelId !== channelId || event.userId === currentUserId) return;
      setTypingName(event.name);
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTypingName(null), TYPING_EXPIRES_MS);
    });
  }, [channelId, currentUserId, socket]);

  if (isLoading || !channel) return <PageSkeleton />;

  const canWrite = channel.kind !== 'aviso' || channel.myRole === 'moderador';

  return (
    <div className="flex h-full flex-col">
      <ConversationHeader
        channel={channel}
        currentUserRole={currentUserRole}
        typingName={typingName}
      />

      <MessageList
        channel={channel}
        currentUserId={currentUserId}
        onReply={setReplyTo}
        onForward={setForwarding}
        onEdit={setEditing}
      />

      <Composer
        channelId={channelId}
        disabled={!canWrite}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        editing={editing}
        onCancelEdit={() => setEditing(null)}
        onTyping={() => socket.emitTyping(channelId)}
      />

      <ForwardMessageDialog message={forwarding} onClose={() => setForwarding(null)} />
    </div>
  );
}
