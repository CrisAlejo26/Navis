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
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Believer as BelieverView } from '@navis/shared';

import { CurrentChurch } from '../common/decorators/current-church.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { ActiveChurchGuard } from '../common/guards/active-church.guard';
import { BelieversService } from './believers.service';
import { toBelieverView } from './believers.mapper';
import { CreateBelieverDto, UpdateBelieverDto } from './dto/believer.dto';
import { BelieversQueryDto } from './dto/believers-query.dto';

/**
 * Las personas de la iglesia, en su versión mínima (RFC 0002 §6). La ficha
 * completa —notas, familia, etiquetas— llega con la RFC 0003 sobre esta misma
 * tabla y estos mismos endpoints.
 */
@ApiTags('creyentes')
@Controller('believers')
@UseGuards(ActiveChurchGuard)
export class BelieversController {
  constructor(private readonly believers: BelieversService) {}

  @Get()
  @RequirePermissions('believers.view')
  @ApiOperation({ summary: 'Las personas de la iglesia activa' })
  @ApiOkResponse({ description: 'Listado de personas' })
  async list(
    @CurrentChurch() churchId: string,
    @Query() query: BelieversQueryDto,
  ): Promise<BelieverView[]> {
    const people = await this.believers.list(churchId, {
      q: query.q,
      ministry: query.ministry,
      onlyActive: !query.includeInactive,
    });

    return people.map(toBelieverView);
  }

  @Post()
  @RequirePermissions('believers.manage')
  @ApiOperation({ summary: 'Da de alta a una persona' })
  async create(
    @CurrentChurch() churchId: string,
    @Body() dto: CreateBelieverDto,
  ): Promise<BelieverView> {
    return toBelieverView(await this.believers.create(churchId, dto));
  }

  @Patch(':id')
  @RequirePermissions('believers.manage')
  @ApiOperation({ summary: 'Edita sus datos o sus ministerios' })
  async update(
    @CurrentChurch() churchId: string,
    @Param('id') id: string,
    @Body() dto: UpdateBelieverDto,
  ): Promise<BelieverView> {
    return toBelieverView(await this.believers.update(churchId, id, dto));
  }

  @Delete(':id')
  @RequirePermissions('believers.manage')
  @ApiOperation({ summary: 'Borrado lógico; sigue apareciendo en lo ya programado' })
  remove(@CurrentChurch() churchId: string, @Param('id') id: string): Promise<void> {
    return this.believers.remove(churchId, id);
  }
}
