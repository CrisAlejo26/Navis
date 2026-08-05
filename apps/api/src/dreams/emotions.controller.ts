import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Emotion as EmotionView, EmotionWithCount } from '@navis/shared';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateEmotionDto, UpdateEmotionDto } from './dto/dream.dto';
import { EmotionsService } from './emotions.service';

/**
 * El vocabulario de emociones (RFC 0005 §5.2).
 *
 * Cuelga de `dreams/emotions` y **se registra antes que `DreamsController`**,
 * porque si no `dreams/:id` se comería la ruta y «emotions» acabaría siendo un
 * identificador.
 *
 * Sin permisos de rol, como el resto del módulo (D1, D2).
 */
@ApiTags('suenos')
@Controller('dreams/emotions')
export class EmotionsController {
  constructor(private readonly emotions: EmotionsService) {}

  @Get()
  @ApiOperation({ summary: 'Las de serie y las mías, con cuántas veces aparecen' })
  list(@CurrentUser('id') ownerId: string): Promise<EmotionWithCount[]> {
    return this.emotions.list(ownerId);
  }

  @Post()
  @ApiOperation({ summary: 'Crea una emoción propia' })
  create(@CurrentUser('id') ownerId: string, @Body() dto: CreateEmotionDto): Promise<EmotionView> {
    return this.emotions.create(ownerId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Renombra o recolorea una propia. 403 si es de serie' })
  update(
    @CurrentUser('id') ownerId: string,
    @Param('id') id: string,
    @Body() dto: UpdateEmotionDto,
  ): Promise<EmotionView> {
    return this.emotions.update(ownerId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Borra una propia, sin tocar los sueños. 403 si es de serie' })
  remove(@CurrentUser('id') ownerId: string, @Param('id') id: string): Promise<void> {
    return this.emotions.remove(ownerId, id);
  }
}
