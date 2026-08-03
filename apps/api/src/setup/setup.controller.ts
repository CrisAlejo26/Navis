import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiConflictResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { ManagedUser, SetupStatus } from '@navis/shared';

import { Public } from '../common/decorators/public.decorator';
import { CreateFirstAdminDto } from './dto/create-first-admin.dto';
import { SetupService } from './setup.service';

/**
 * Primer arranque. Es público porque todavía no hay ninguna cuenta con la que
 * autenticarse: lo que lo protege es que solo responde mientras la instalación
 * esté vacía, más un límite de peticiones más estrecho que el general.
 */
@ApiTags('primer arranque')
@Public()
@Controller('setup')
export class SetupController {
  constructor(private readonly setup: SetupService) {}

  @Get('status')
  @ApiOperation({ summary: '¿Hace falta crear la primera cuenta?' })
  @ApiOkResponse({ description: '{ needsSetup: boolean }' })
  getStatus(): Promise<SetupStatus> {
    return this.setup.getStatus();
  }

  @Post('admin')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Crea la primera cuenta con el rol de administrador' })
  @ApiOkResponse({ description: 'La cuenta creada' })
  @ApiConflictResponse({ description: 'La instalación ya tiene cuentas' })
  createFirstAdmin(@Body() dto: CreateFirstAdminDto): Promise<ManagedUser> {
    return this.setup.createFirstAdmin(dto);
  }
}
