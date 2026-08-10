import { useState } from 'react';
import { Outlet, useParams } from 'react-router';

import { ChannelList } from '@/components/chat/channel-list';
import { NewConversationDialog } from '@/components/chat/new-conversation-dialog';
import { ChatSocketProvider } from '@/lib/chat/chat-socket-context';
import { cn } from '@/lib/cn';

/**
 * El maestro-detalle de Comunicaciones (RFC 0016 §5): dos columnas fijas en
 * escritorio, una vista cada vez en móvil (Regla 5).
 *
 * `-m-4 md:-m-8` cancela el `padding` de `<main>` en `app-layout.tsx`: esta es
 * la única pantalla que necesita ocupar el panel de lado a lado, como una
 * bandeja de correo.
 */
export function CommunicationsPage() {
  const { channelId } = useParams();
  const [creating, setCreating] = useState(false);

  return (
    <ChatSocketProvider>
      <div className="-m-4 md:-m-8 md:grid-cols-[20rem_1fr] md:h-dvh grid h-[calc(100dvh-3.5rem)] overflow-hidden">
        <div className={cn(channelId ? 'md:block hidden' : 'block')}>
          <ChannelList onNewConversation={() => setCreating(true)} />
        </div>
        <div className={cn('min-w-0', channelId ? 'block' : 'md:block hidden')}>
          <Outlet />
        </div>
      </div>

      <NewConversationDialog open={creating} onClose={() => setCreating(false)} />
    </ChatSocketProvider>
  );
}
