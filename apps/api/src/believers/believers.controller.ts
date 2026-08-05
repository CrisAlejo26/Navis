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
import type {
  BelieverExportRow,
  BelieverListItem,
  BelieversSummary,
  ExportResponse,
  Paginated,
} from '@navis/shared';

import { ChurchClockService } from '../churches/church-clock.service';
import { CurrentChurch } from '../common/decorators/current-church.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { ActiveChurchGuard } from '../common/guards/active-church.guard';
import { BelieversExportService } from './believers-export.service';
import { BelieversPageService } from './believers-page.service';
import { BelieversSummaryService } from './believers-summary.service';
import { BelieversService } from './believers.service';
import { CreateBelieverDto, SetCongregationDto, UpdateBelieverDto } from './dto/believer.dto';
import { BelieversExportQueryDto } from './dto/believers-export.dto';
import { BelieversQueryDto } from './dto/believers-query.dto';

/**
 * Las personas de la iglesia activa y su ficha (RFC 0003 §6).
 *
 * `summary` va declarado antes que `:id`: con el orden al revés, Nest
 * intentaría resolver «summary» como un identificador.
 *
 * Todo devuelve la misma forma —`BelieverListItem`, con el aviso ya
 * calculado—, para que la interfaz no tenga que volver a pedir nada después de
 * crear o de editar.
 */
@ApiTags('creyentes')
@Controller('believers')
@UseGuards(ActiveChurchGuard)
export class BelieversController {
  constructor(
    private readonly believers: BelieversService,
    private readonly page: BelieversPageService,
    private readonly summaries: BelieversSummaryService,
    private readonly exports: BelieversExportService,
    private readonly clock: ChurchClockService,
  ) {}

  @Get()
  @RequirePermissions('believers.view')
  @ApiOperation({ summary: 'Listado paginado, con filtros y orden' })
  @ApiOkResponse({ description: 'Página de personas, con su aviso ya calculado' })
  async list(
    @CurrentChurch() churchId: string,
    @Query() query: BelieversQueryDto,
  ): Promise<Paginated<BelieverListItem>> {
    return this.page.findPage(
      churchId,
      { ...query, search: query.search || undefined },
      await this.clock.today(churchId),
    );
  }

  @Get('summary')
  @RequirePermissions('believers.view')
  @ApiOperation({ summary: 'Las cuentas de la cabecera' })
  async summary(@CurrentChurch() churchId: string): Promise<BelieversSummary> {
    return this.summaries.of(churchId, await this.clock.today(churchId));
  }

  /**
   * Antes que `:id`, como `summary`. **Sin permiso propio** (RFC 0009 D12):
   * quien puede ver esto en pantalla puede copiarlo a mano, así que un
   * `export.*` aparte no protegería nada y daría a entender que sí.
   */
  @Get('export')
  @RequirePermissions('believers.view')
  @ApiOperation({ summary: 'Las filas del listado sin paginar, para exportarlas' })
  async export(
    @CurrentChurch() churchId: string,
    @Query() query: BelieversExportQueryDto,
  ): Promise<ExportResponse<BelieverExportRow>> {
    return this.exports.export(
      churchId,
      { ...query, search: query.search || undefined },
      await this.clock.today(churchId),
    );
  }

  @Post()
  @RequirePermissions('believers.manage')
  @ApiOperation({ summary: 'Da de alta a una persona' })
  async create(
    @CurrentChurch() churchId: string,
    @Body() dto: CreateBelieverDto,
  ): Promise<BelieverListItem> {
    const believer = await this.believers.create(churchId, dto);
    return this.believers.detail(churchId, believer.id, await this.clock.today(churchId));
  }

  /** Antes que `:id` por lo de siempre: si no, «congregation» sería un id. */
  @Patch('congregation')
  @RequirePermissions('believers.manage')
  @ApiOperation({ summary: 'Pone la misma sede a varias personas de una vez' })
  async setCongregation(
    @CurrentChurch() churchId: string,
    @Body() dto: SetCongregationDto,
  ): Promise<{ updated: number }> {
    const updated = await this.believers.setCongregation(
      churchId,
      dto.believerIds,
      dto.congregationId,
    );

    return { updated };
  }

  @Get(':id')
  @RequirePermissions('believers.view')
  @ApiOperation({ summary: 'La ficha, con sus labores y sus dones' })
  async findOne(
    @CurrentChurch() churchId: string,
    @Param('id') id: string,
  ): Promise<BelieverListItem> {
    return this.believers.detail(churchId, id, await this.clock.today(churchId));
  }

  @Patch(':id')
  @RequirePermissions('believers.manage')
  @ApiOperation({ summary: 'Edita la ficha, incluidos estado, dones y margen' })
  async update(
    @CurrentChurch() churchId: string,
    @Param('id') id: string,
    @Body() dto: UpdateBelieverDto,
  ): Promise<BelieverListItem> {
    await this.believers.update(churchId, id, dto);
    return this.believers.detail(churchId, id, await this.clock.today(churchId));
  }

  @Delete(':id')
  @RequirePermissions('believers.manage')
  @ApiOperation({ summary: 'Borrado lógico; sigue apareciendo en lo ya programado' })
  remove(@CurrentChurch() churchId: string, @Param('id') id: string): Promise<void> {
    return this.believers.remove(churchId, id);
  }
}
