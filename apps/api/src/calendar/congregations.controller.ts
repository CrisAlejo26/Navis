import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentChurch } from '../common/decorators/current-church.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { ActiveChurchGuard } from '../common/guards/active-church.guard';
import type { Congregation } from './congregation.entity';
import { CongregationsService } from './congregations.service';
import { CalendarsService } from './calendars.service';
import { CreateCongregationDto, UpdateCongregationDto } from './dto/congregation.dto';
import { WeekSeederService } from './week-seeder.service';

/**
 * Las sedes de la iglesia activa. **No son de un calendario** (D17): Elda es
 * Elda para el púlpito y para el sonido. Se leen con `calendar.view` —hacen
 * falta para pintar cualquier calendario— y se tocan con `calendar.manage`.
 */
@ApiTags('calendario')
@Controller('congregations')
@UseGuards(ActiveChurchGuard)
export class CongregationsController {
  constructor(
    private readonly congregations: CongregationsService,
    private readonly calendars: CalendarsService,
    private readonly week: WeekSeederService,
  ) {}

  @Get()
  @RequirePermissions('calendar.view')
  @ApiOperation({ summary: 'Las sedes, en su orden' })
  @ApiOkResponse({ description: 'Listado de sedes' })
  async list(@CurrentChurch() churchId: string): Promise<Congregation[]> {
    const existentes = await this.congregations.list(churchId);
    if (existentes.length > 0) return existentes;

    // Primera vez en esta iglesia: misma siembra completa que en `/calendars`,
    // por si esta pantalla se pide antes que aquella.
    const { congregations } = await this.week.ensureScaffold(churchId);
    return congregations;
  }

  @Post()
  @RequirePermissions('calendar.manage')
  @ApiOperation({ summary: 'Crea una sede: nombre y color' })
  async create(
    @CurrentChurch() churchId: string,
    @Body() dto: CreateCongregationDto,
  ): Promise<Congregation> {
    const congregation = await this.congregations.create(churchId, dto);

    // La sede nueva arranca con la semana de serie en todos los calendarios:
    // las reuniones varían de una sede a otra, y se ajustan desde ahí.
    const calendars = await this.calendars.ensureFor(churchId);
    await this.week.seedCongregation(
      churchId,
      congregation.id,
      calendars.map((one) => one.id),
    );

    return congregation;
  }

  @Patch(':id')
  @RequirePermissions('calendar.manage')
  @ApiOperation({ summary: 'Edita o apaga una sede' })
  update(
    @CurrentChurch() churchId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCongregationDto,
  ): Promise<Congregation> {
    return this.congregations.update(churchId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('calendar.manage')
  @ApiOperation({ summary: 'Borrado lógico; nunca la última' })
  remove(@CurrentChurch() churchId: string, @Param('id') id: string): Promise<void> {
    return this.congregations.remove(churchId, id);
  }
}
