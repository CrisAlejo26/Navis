import { chatOrigin, useChatSocket } from '@navis/api-client';
import type { ReactNode } from 'react';

import { env } from '@/lib/env';
import { ChatSocketContext } from './chat-socket-hooks';

/**
 * Conecta el socket una vez por sesión de la pantalla de comunicaciones (RFC
 * 0016 §6) y lo deja disponible para la lista y la conversación abierta, sin
 * pasarlo a mano por cada componente intermedio.
 *
 * Sin `getCookie`: en la web la cookie de sesión viaja sola con
 * `withCredentials`. Solo hace falta pasarla a mano en móvil (D6).
 */
export function ChatSocketProvider({ children }: { children: ReactNode }) {
  const socket = useChatSocket({ origin: chatOrigin(env.VITE_API_URL) });
  return <ChatSocketContext.Provider value={socket}>{children}</ChatSocketContext.Provider>;
}
