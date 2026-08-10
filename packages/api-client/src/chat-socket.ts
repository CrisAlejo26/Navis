import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';

import { queryKeys } from './query-keys';

export interface ChatSocketOptions {
  /** El origen del servidor de Socket.IO. Se calcula con `chatOrigin`. */
  origin: string;
  /**
   * En móvil no hay cookies de navegador: se manda a mano en el *handshake*
   * (RFC 0016 D6), igual que en cada petición REST. En web se omite.
   */
  getCookie?: () => string | undefined;
}

export type ChatConnectionState = 'connected' | 'connecting' | 'offline';

export interface TypingEvent {
  channelId: string;
  userId: string;
  name: string;
}

export interface ChatSocket {
  state: ChatConnectionState;
  /** Cubre el canal creado mientras la sesión ya estaba conectada. */
  joinChannel: (channelId: string) => void;
  emitTyping: (channelId: string) => void;
  /** Devuelve la función para dejar de escuchar. */
  onTyping: (handler: (event: TypingEvent) => void) => () => void;
}

/** `http://localhost:3000/api/v1` → `http://localhost:3000`: el socket no vive bajo el prefijo de versión (§8). */
export function chatOrigin(apiBaseUrl: string): string {
  const url = new URL(apiBaseUrl);
  return `${url.protocol}//${url.host}`;
}

function invalidateChat(client: QueryClient) {
  void client.invalidateQueries({ queryKey: queryKeys.chat.all });
}

/**
 * Se conecta una vez por sesión de la pantalla de comunicaciones (§6). El
 * cliente que lo use decide cómo caer a sondeo cuando `state !== 'connected'`
 * (por ejemplo, con `refetchInterval` en `useChannels`/`useMessages`): este
 * hook solo informa del estado, no sondea él mismo.
 */
export function useChatSocket(options: ChatSocketOptions): ChatSocket {
  const client = useQueryClient();
  const [state, setState] = useState<ChatConnectionState>('connecting');
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(options.origin, {
      withCredentials: true,
      auth: options.getCookie ? { cookie: options.getCookie() } : undefined,
    });
    socketRef.current = socket;

    socket.on('connect', () => setState('connected'));
    socket.on('disconnect', () => setState('offline'));
    socket.on('connect_error', () => setState('offline'));

    socket.on('message:new', () => invalidateChat(client));
    socket.on('message:updated', () => invalidateChat(client));
    socket.on('channel:read', () => invalidateChat(client));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // Se reconecta solo si cambia el origen: `getCookie` se lee en el momento
    // de conectar y no hace falta como dependencia.
  }, [options.origin]);

  const joinChannel = useCallback((channelId: string) => {
    socketRef.current?.emit('channel:join', { channelId });
  }, []);

  const emitTyping = useCallback((channelId: string) => {
    socketRef.current?.emit('channel:typing', { channelId });
  }, []);

  const onTyping = useCallback((handler: (event: TypingEvent) => void) => {
    const socket = socketRef.current;
    if (!socket) return () => {};

    socket.on('channel:typing', handler);
    return () => socket.off('channel:typing', handler);
  }, []);

  return { state, joinChannel, emitTyping, onTyping };
}
