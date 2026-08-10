import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Message, MessagesPage } from '@navis/shared';

import { CurrentChurch } from '../common/decorators/current-church.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { ActiveChurchGuard } from '../common/guards/active-church.guard';
import {
  CreateMessageDto,
  ForwardMessageDto,
  ReactMessageDto,
  UpdateMessageDto,
} from './dto/message.dto';
import { MessagesQueryDto } from './dto/query.dto';
import { MessageForwardService } from './message-forward.service';
import { MessageReactionsService } from './message-reactions.service';
import { MessagesService } from './messages.service';

/**
 * Los mensajes de un canal. Editar y borrar cuelgan de `/messages/:id` y no
 * de `/channels/:id/messages/:id`: solo hace falta el mensaje para saber
 * quién puede tocarlo, igual que `PATCH /api/v1/messages/:id` en el RFC.
 */
@ApiTags('comunicaciones')
@Controller()
@UseGuards(ActiveChurchGuard)
@RequirePermissions('communications.view')
export class MessagesController {
  constructor(
    private readonly messages: MessagesService,
    private readonly reactions: MessageReactionsService,
    private readonly forward: MessageForwardService,
  ) {}

  @Get('channels/:id/messages')
  @ApiOperation({ summary: 'Historial paginado hacia atrás, con `before` (§3)' })
  page(
    @CurrentChurch() churchId: string,
    @CurrentUser('id') userId: string,
    @Param('id') channelId: string,
    @Query() query: MessagesQueryDto,
  ): Promise<MessagesPage> {
    return this.messages.page(churchId, userId, channelId, query);
  }

  @Post('channels/:id/messages')
  send(
    @CurrentChurch() churchId: string,
    @CurrentUser('id') userId: string,
    @Param('id') channelId: string,
    @Body() dto: CreateMessageDto,
  ): Promise<Message> {
    return this.messages.send(churchId, userId, channelId, dto);
  }

  @Patch('messages/:id')
  edit(
    @CurrentChurch() churchId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMessageDto,
  ): Promise<Message> {
    return this.messages.edit(churchId, userId, id, dto);
  }

  @Delete('messages/:id')
  @ApiOperation({ summary: 'Borrado lógico: deja «Mensaje eliminado» sin quitar la fila' })
  remove(
    @CurrentChurch() churchId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.messages.remove(churchId, userId, id);
  }

  @Post('messages/:id/reactions')
  react(
    @CurrentChurch() churchId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: ReactMessageDto,
  ): Promise<void> {
    return this.reactions.react(churchId, userId, id, dto.emoji);
  }

  @Delete('messages/:id/reactions/:emoji')
  unreact(
    @CurrentChurch() churchId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Param('emoji') emoji: string,
  ): Promise<void> {
    return this.reactions.unreact(churchId, userId, id, decodeURIComponent(emoji));
  }

  @Post('messages/:id/forward')
  @ApiOperation({ summary: 'Copia el mensaje a otras conversaciones (D4)' })
  forwardMessage(
    @CurrentChurch() churchId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: ForwardMessageDto,
  ): Promise<Message[]> {
    return this.forward.forward(churchId, userId, id, dto.channelIds);
  }
}
