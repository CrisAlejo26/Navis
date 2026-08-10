import type { ChatSocket } from '@navis/api-client';
import { createContext, useContext } from 'react';

/**
 * El contexto en sí, y los hooks que lo leen: en su propio fichero para que
 * `chat-socket-context.tsx` exporte solo el componente `ChatSocketProvider`
 * (Regla 1 §6: exportar una constante junto a un componente rompe el
 * recambio en caliente).
 */
export const ChatSocketContext = createContext<ChatSocket | null>(null);

/** El sondeo de respaldo (§8): 30 s cuando el socket no está conectado, si no, nada. */
export function usePollFallback(): number | undefined {
  const socket = useContext(ChatSocketContext);
  return socket && socket.state !== 'connected' ? 30_000 : undefined;
}

export function useChatSocketContext(): ChatSocket {
  const socket = useContext(ChatSocketContext);
  if (!socket) throw new Error('useChatSocketContext debe usarse dentro de ChatSocketProvider');
  return socket;
}
