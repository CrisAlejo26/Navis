import type { Message } from '@navis/shared';

/**
 * Punto de extensión para el tiempo real del chat (interfaz + token, patrón
 * ya usado por `AiProvider`, Regla 1 §3).
 *
 * Los servicios de mensajes llaman a estos métodos sin saber que hay un
 * socket detrás: así `messages.service.test.ts` prueba la lógica de negocio
 * con un `ChatBroadcaster` falso, sin levantar Socket.IO, con el mismo
 * criterio de «inyecta en vez de mockear» que ya usa `createApiClient`.
 */
export interface ChatBroadcaster {
  /** Un mensaje nuevo, incluido el resultado de reenviar o de adjuntar. */
  messageCreated(message: Message): void;
  /** Editado, borrado (lógico) o con una reacción cambiada. */
  messageUpdated(message: Message): void;
  /** Para que el contador de no leídos baje en los demás dispositivos. */
  channelRead(channelId: string, userId: string): void;
  /** «Escribiendo…»; el cliente lo hace expirar solo si no llega el siguiente. */
  typing(channelId: string, userId: string, name: string): void;
  /** Cuando alguien sale de un grupo, para que su sesión abandone la sala. */
  memberLeft(channelId: string, userId: string): void;
}

export const CHAT_BROADCASTER = Symbol('CHAT_BROADCASTER');
