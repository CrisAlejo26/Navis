import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Message } from '@navis/shared';
import type { IncomingHttpHeaders } from 'node:http';
import type { Server, Socket } from 'socket.io';
import { Repository } from 'typeorm';

import { AuthService } from '../auth/auth.service';
import { env } from '../config/env';
import { ChannelMember } from './channel-member.entity';
import type { ChatBroadcaster } from './chat-broadcaster';

interface SocketData {
  userId: string;
  name: string;
}

const channelRoom = (channelId: string): string => `channel:${channelId}`;

/**
 * Adaptador real de `ChatBroadcaster` sobre Socket.IO (RFC 0016 §6, §8).
 *
 * La autenticación reutiliza `AuthService.getSession`, la misma función que
 * usa `SessionGuard`: la cookie llega en la cabecera (web/escritorio) o en
 * `handshake.auth.cookie` (móvil, que no tiene cookies de navegador y la
 * manda a mano, como ya hace en cada petición REST). Cero mecanismos de
 * autenticación nuevos (D6).
 *
 * No vive bajo `/api/v1` (§8): el *handshake* de Socket.IO es una petición
 * HTTP aparte que no pasa por el enrutador de Nest ni por su versionado.
 *
 * Al conectar, la sesión se une a **todas** sus salas de canal, no solo a la
 * que tenga abierta: así el contador de no leídos y la fila del listado se
 * actualizan aunque esa conversación no esté en pantalla. `channel:join`
 * cubre el hueco de un canal creado después de conectar.
 */
@Injectable()
@WebSocketGateway({ cors: { origin: env.CORS_ORIGINS, credentials: true } })
export class ChatGateway implements ChatBroadcaster, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  private server: Server;

  constructor(
    private readonly authService: AuthService,
    @InjectRepository(ChannelMember) private readonly members: Repository<ChannelMember>,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    const session = await this.sessionOf(client);
    if (!session) {
      client.disconnect(true);
      return;
    }

    const data: SocketData = { userId: session.user.id, name: session.user.name };
    client.data = data;

    const memberships = await this.members.find({ where: { userId: data.userId } });
    for (const membership of memberships) {
      await client.join(channelRoom(membership.channelId));
    }
  }

  handleDisconnect(client: Socket): void {
    // Socket.IO ya limpia las salas de la conexión al desconectar.
    this.logger.debug(`Socket ${client.id} desconectado`);
  }

  /** Cubre el canal creado mientras la sesión ya estaba conectada. */
  @SubscribeMessage('channel:join')
  async onJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { channelId: string },
  ): Promise<void> {
    const data = client.data as SocketData | undefined;
    if (!data) return;

    const isMember = await this.members.exists({
      where: { channelId: body.channelId, userId: data.userId },
    });
    if (isMember) await client.join(channelRoom(body.channelId));
  }

  /** «Escribiendo…»: se reenvía al resto del canal, nunca a quien lo mandó. */
  @SubscribeMessage('channel:typing')
  onTyping(@ConnectedSocket() client: Socket, @MessageBody() body: { channelId: string }): void {
    const data = client.data as SocketData | undefined;
    if (!data) return;

    client
      .to(channelRoom(body.channelId))
      .emit('channel:typing', { channelId: body.channelId, userId: data.userId, name: data.name });
  }

  messageCreated(message: Message): void {
    this.server.to(channelRoom(message.channelId)).emit('message:new', message);
  }

  messageUpdated(message: Message): void {
    this.server.to(channelRoom(message.channelId)).emit('message:updated', message);
  }

  channelRead(channelId: string, userId: string): void {
    this.server.to(channelRoom(channelId)).emit('channel:read', { channelId, userId });
  }

  typing(channelId: string, userId: string, name: string): void {
    this.server.to(channelRoom(channelId)).emit('channel:typing', { channelId, userId, name });
  }

  memberLeft(channelId: string, userId: string): void {
    for (const socket of this.server.sockets.sockets.values()) {
      if ((socket.data as SocketData | undefined)?.userId === userId) {
        void socket.leave(channelRoom(channelId));
      }
    }
  }

  private async sessionOf(client: Socket): ReturnType<AuthService['getSession']> {
    const auth = client.handshake.auth as { cookie?: string };
    const headers: IncomingHttpHeaders = auth.cookie
      ? { cookie: auth.cookie }
      : client.handshake.headers;

    return this.authService.getSession(headers);
  }
}
