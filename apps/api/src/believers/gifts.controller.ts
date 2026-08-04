import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Gift as GiftView } from '@navis/shared';

import { CurrentChurch } from '../common/decorators/current-church.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { ActiveChurchGuard } from '../common/guards/active-church.guard';
import { toGiftView } from './believers.mapper';
import { CreateGiftDto, UpdateGiftDto } from './dto/gift.dto';
import { GiftsService } from './gifts.service';

/**
 * El catálogo de **dones** de la iglesia activa (RFC 0003 D5).
 *
 * Cuelga de los permisos `believers.*` y no de un módulo propio: un don es
 * parte de la ficha de una persona, no una sección aparte (D13).
 */
@ApiTags('creyentes')
@Controller('gifts')
@UseGuards(ActiveChurchGuard)
export class GiftsController {
  constructor(private readonly gifts: GiftsService) {}

  @Get()
  @RequirePermissions('believers.view')
  @ApiOperation({ summary: 'El catálogo, en su orden' })
  @ApiOkResponse({ description: 'Listado de dones' })
  async list(@CurrentChurch() churchId: string): Promise<GiftView[]> {
    return (await this.gifts.ensureFor(churchId)).map(toGiftView);
  }

  @Post()
  @RequirePermissions('believers.manage')
  @ApiOperation({ summary: 'Añade un don al catálogo' })
  async create(@CurrentChurch() churchId: string, @Body() dto: CreateGiftDto): Promise<GiftView> {
    return toGiftView(await this.gifts.create(churchId, dto));
  }

  @Patch(':id')
  @RequirePermissions('believers.manage')
  @ApiOperation({ summary: 'Renombra, recolorea, activa o desactiva' })
  async update(
    @CurrentChurch() churchId: string,
    @Param('id') id: string,
    @Body() dto: UpdateGiftDto,
  ): Promise<GiftView> {
    return toGiftView(await this.gifts.update(churchId, id, dto));
  }

  @Delete(':id')
  @RequirePermissions('believers.manage')
  @ApiOperation({ summary: 'Solo los que no son de serie; esos se desactivan' })
  remove(@CurrentChurch() churchId: string, @Param('id') id: string): Promise<void> {
    return this.gifts.remove(churchId, id);
  }
}
