import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Tag } from '@navis/shared';

import { CurrentChurch } from '../common/decorators/current-church.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { ActiveChurchGuard } from '../common/guards/active-church.guard';
import { CreateTagDto, UpdateTagDto } from './dto/tag.dto';
import { TagsService } from './tags.service';

/** El vocabulario de etiquetas de tareas y hábitos (RFC 0018 §5.1, D12). */
@ApiTags('tareas')
@Controller('tags')
@UseGuards(ActiveChurchGuard)
@RequirePermissions('tasks.view')
export class TagsController {
  constructor(private readonly tags: TagsService) {}

  @Get()
  @ApiOperation({ summary: 'El vocabulario de la cuenta en la iglesia activa' })
  list(@CurrentChurch() churchId: string, @CurrentUser('id') ownerId: string): Promise<Tag[]> {
    return this.tags.list(churchId, ownerId);
  }

  @Post()
  @ApiOperation({ summary: 'Crea una etiqueta' })
  create(
    @CurrentChurch() churchId: string,
    @CurrentUser('id') ownerId: string,
    @Body() dto: CreateTagDto,
  ): Promise<Tag> {
    return this.tags.create(churchId, ownerId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edita una etiqueta' })
  update(
    @CurrentChurch() churchId: string,
    @CurrentUser('id') ownerId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTagDto,
  ): Promise<Tag> {
    return this.tags.update(churchId, ownerId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Borra una etiqueta, en cascada de sus usos' })
  async remove(
    @CurrentChurch() churchId: string,
    @CurrentUser('id') ownerId: string,
    @Param('id') id: string,
  ): Promise<void> {
    await this.tags.remove(churchId, ownerId, id);
  }
}
