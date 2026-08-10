import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ChannelMember } from './channel-member.entity';
import { Message } from './message.entity';

/** Recorte de mensaje sin firmar: `ChatParticipantsService.usersById` pone el nombre. */
export interface RawLastMessage {
  id: string;
  body: string | null;
  authorId: string;
  hasAttachment: boolean;
  createdAt: string;
  deletedAt: string | null;
}

/**
 * Lo que hace falta para pintar el listado de canales sin una consulta por
 * fila: cuántos mensajes sin leer tiene cada uno y cuál fue el último.
 *
 * Los mensajes se leen **con `withDeleted()`**: uno borrado sigue en el hilo
 * como «Mensaje eliminado» (RFC 0016 §3), así que nunca se filtra por la
 * columna `deletedAt` de la manera automática de TypeORM — se comprueba a
 * mano en el mapeo.
 */
@Injectable()
export class ChannelStatsService {
  constructor(@InjectRepository(Message) private readonly messages: Repository<Message>) {}

  /** Mensajes de otros posteriores a `lastReadAt`, uno por canal, en una sola consulta. */
  async unreadCounts(userId: string, channelIds: string[]): Promise<Map<string, number>> {
    if (channelIds.length === 0) return new Map();

    const rows = await this.messages
      .createQueryBuilder('message')
      .innerJoin(
        ChannelMember,
        'member',
        'member.channelId = message.channelId AND member.userId = :userId',
        { userId },
      )
      .select('message.channelId', 'channelId')
      .addSelect('COUNT(*)', 'total')
      .where('message.channelId IN (:...channelIds)', { channelIds })
      .andWhere('message.authorId != :userId', { userId })
      .andWhere('message.createdAt > member.lastReadAt')
      .withDeleted()
      .groupBy('message.channelId')
      .getRawMany<{ channelId: string; total: string }>();

    return new Map(rows.map((row) => [row.channelId, Number(row.total)]));
  }

  /**
   * El último mensaje de cada canal. Una consulta por canal: para el número
   * de conversaciones de una congregación (no miles) es una tabla de precios
   * razonable a cambio de no depender de `ROW_NUMBER()`, que en SQLite solo
   * está en versiones recientes de `better-sqlite3`.
   */
  async lastMessages(channelIds: string[]): Promise<Map<string, RawLastMessage>> {
    const result = new Map<string, RawLastMessage>();

    for (const channelId of channelIds) {
      const message = await this.messages
        .createQueryBuilder('message')
        .leftJoinAndSelect('message.attachments', 'attachment')
        .where('message.channelId = :channelId', { channelId })
        .withDeleted()
        .orderBy('message.createdAt', 'DESC')
        .getOne();
      if (!message) continue;

      result.set(channelId, {
        id: message.id,
        body: message.deletedAt ? null : message.body,
        authorId: message.authorId,
        hasAttachment: message.attachments.length > 0,
        createdAt: message.createdAt.toISOString(),
        deletedAt: message.deletedAt?.toISOString() ?? null,
      });
    }

    return result;
  }
}
