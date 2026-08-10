import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ChurchesModule } from '../churches/churches.module';
import { MediaModule } from '../media/media.module';
import { RolesModule } from '../roles/roles.module';
import { AttachmentsController } from './attachments.controller';
import { AttachmentsService } from './attachments.service';
import { ChannelAccessService } from './channel-access.service';
import { ChannelMember } from './channel-member.entity';
import { ChannelStatsService } from './channel-stats.service';
import { Channel } from './channel.entity';
import { ChannelsArchiveService } from './channels-archive.service';
import { ChannelsListService } from './channels-list.service';
import { ChannelsController } from './channels.controller';
import { ChannelsService } from './channels.service';
import { CHAT_BROADCASTER } from './chat-broadcaster';
import { ChatGateway } from './chat.gateway';
import { ChatParticipantsService } from './chat-participants.service';
import { MessageAttachment } from './message-attachment.entity';
import { MessageForwardService } from './message-forward.service';
import { MessageReaction } from './message-reaction.entity';
import { MessageReactionsService } from './message-reactions.service';
import { Message } from './message.entity';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';

/**
 * Comunicaciones (RFC 0016): canales, mensajes, adjuntos y reacciones.
 *
 * Depende de `ChurchesModule` porque `ActiveChurchGuard` necesita resolver la
 * iglesia activa, y de `RolesModule` porque `ChatParticipantsService`
 * resuelve quién puede chatear a partir de los permisos de cada rol (§2).
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Channel, ChannelMember, Message, MessageAttachment, MessageReaction]),
    ChurchesModule,
    RolesModule,
    MediaModule,
  ],
  controllers: [ChannelsController, MessagesController, AttachmentsController],
  providers: [
    ChatParticipantsService,
    ChannelAccessService,
    ChannelStatsService,
    ChannelsService,
    ChannelsListService,
    ChannelsArchiveService,
    MessagesService,
    MessageReactionsService,
    MessageForwardService,
    AttachmentsService,
    ChatGateway,
    { provide: CHAT_BROADCASTER, useExisting: ChatGateway },
  ],
})
export class ChatModule {}
