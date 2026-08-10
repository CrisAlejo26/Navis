import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { ChannelDetail, ChannelListItem, ChatContact, RoleSlug } from '@navis/shared';

import { CurrentChurch } from '../common/decorators/current-church.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { ActiveChurchGuard } from '../common/guards/active-church.guard';
import { ChannelsArchiveService } from './channels-archive.service';
import { ChannelsListService } from './channels-list.service';
import { ChannelsService } from './channels.service';
import { ChatParticipantsService } from './chat-participants.service';
import {
  ContactsQueryDto,
  CreateChannelDto,
  MuteChannelDto,
  UpdateChannelDto,
} from './dto/channel.dto';
import { ChannelsQueryDto } from './dto/query.dto';

/**
 * Los canales. El rol `creyente` queda fuera solo: `ROLE_PERMISSIONS.creyente`
 * no lleva `communications.view` (RFC 0016 §2), así que este guard ya basta.
 *
 * `contacts` va **antes** que `:id`: si no, Nest intentaría resolver
 * `/channels/contacts` como si `contacts` fuera un identificador.
 */
@ApiTags('comunicaciones')
@Controller('channels')
@UseGuards(ActiveChurchGuard)
@RequirePermissions('communications.view')
export class ChannelsController {
  constructor(
    private readonly channels: ChannelsService,
    private readonly list: ChannelsListService,
    private readonly archive: ChannelsArchiveService,
    private readonly participants: ChatParticipantsService,
  ) {}

  @Get('contacts')
  @ApiOperation({ summary: 'Cuentas con las que se puede hablar en esta iglesia (§2)' })
  contacts(
    @CurrentChurch() churchId: string,
    @CurrentUser('id') userId: string,
    @Query() query: ContactsQueryDto,
  ): Promise<ChatContact[]> {
    return this.participants.contactsOf(churchId, userId, query.search);
  }

  @Get()
  @ApiOperation({ summary: 'Los canales de esta cuenta, con el no leídos ya calculado' })
  findAll(
    @CurrentChurch() churchId: string,
    @CurrentUser('id') userId: string,
    @Query() query: ChannelsQueryDto,
  ): Promise<ChannelListItem[]> {
    return this.list.list(churchId, userId, { archived: query.archived });
  }

  @Post()
  @ApiOperation({ summary: 'Crea una conversación individual, de grupo o de aviso (D5)' })
  create(
    @CurrentChurch() churchId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateChannelDto,
  ): Promise<ChannelDetail> {
    return this.channels.create(churchId, userId, dto);
  }

  @Get(':id')
  get(
    @CurrentChurch() churchId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<ChannelDetail> {
    return this.channels.get(churchId, userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Renombra o cambia la descripción de un grupo o un aviso' })
  update(
    @CurrentChurch() churchId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateChannelDto,
  ): Promise<ChannelDetail> {
    return this.channels.update(churchId, userId, id, dto);
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'Archivo personal: sale de mi bandeja (D2)' })
  archivePersonal(
    @CurrentChurch() churchId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.archive.setPersonalArchive(churchId, userId, id, true);
  }

  @Post(':id/unarchive')
  unarchivePersonal(
    @CurrentChurch() churchId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.archive.setPersonalArchive(churchId, userId, id, false);
  }

  @Post(':id/global-archive')
  @ApiOperation({ summary: 'Archivo global: solo pastor o superadministrador (§13)' })
  globalArchive(
    @CurrentChurch() churchId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: RoleSlug,
    @Param('id') id: string,
  ): Promise<void> {
    return this.archive.setGlobalArchive(churchId, userId, role, id, true);
  }

  @Post(':id/global-unarchive')
  globalUnarchive(
    @CurrentChurch() churchId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: RoleSlug,
    @Param('id') id: string,
  ): Promise<void> {
    return this.archive.setGlobalArchive(churchId, userId, role, id, false);
  }

  @Post(':id/clear')
  @ApiOperation({ summary: 'Limpia el historial que veo, sin tocar lo que ve el resto (D3)' })
  clear(
    @CurrentChurch() churchId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.archive.clearHistory(churchId, userId, id);
  }

  @Post(':id/read')
  markRead(
    @CurrentChurch() churchId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.archive.markRead(churchId, userId, id);
  }

  @Post(':id/mute')
  @ApiOperation({ summary: 'Silenciar, obligatorio desde el primer día (RFC 0006)' })
  mute(
    @CurrentChurch() churchId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: MuteChannelDto,
  ): Promise<void> {
    return this.archive.setMuted(
      churchId,
      userId,
      id,
      dto.until ? new Date(dto.until) : new Date('9999-12-31'),
    );
  }

  @Post(':id/unmute')
  unmute(
    @CurrentChurch() churchId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.archive.setMuted(churchId, userId, id, null);
  }

  @Post(':id/leave')
  @ApiOperation({ summary: 'Salir de un grupo o de un aviso' })
  leave(
    @CurrentChurch() churchId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.channels.leave(churchId, userId, id);
  }
}
