import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { DashboardSummary } from '@navis/shared';

import { CurrentChurch } from '../common/decorators/current-church.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { ActiveChurchGuard } from '../common/guards/active-church.guard';
import { DashboardService } from './dashboard.service';

/** El panel de inicio (RFC 0001): una sola llamada para toda la portada. */
@ApiTags('panel')
@Controller('dashboard')
@UseGuards(ActiveChurchGuard)
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('summary')
  @RequirePermissions('dashboard.view')
  @ApiOperation({ summary: 'Las tarjetas, gráficas y agenda de la portada' })
  @ApiOkResponse({ description: 'Todo el panel, en una sola respuesta' })
  summary(
    @CurrentChurch() churchId: string,
    @CurrentUser('id') ownerId: string,
  ): Promise<DashboardSummary> {
    return this.dashboard.summary(churchId, ownerId);
  }
}
