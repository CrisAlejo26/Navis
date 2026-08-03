import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  type HealthCheckResult,
  HealthCheckService,
  MemoryHealthIndicator,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';

import { Public } from '../common/decorators/public.decorator';

@ApiTags('health')
// `VERSION_NEUTRAL` además de estar excluido del prefijo: sin esto el
// versionado por URI lo dejaría en /v1/health, y tanto el HEALTHCHECK de
// Docker como el sondeo del despliegue consultan /health a secas.
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
  ) {}

  /** Lo consulta el HEALTHCHECK de Docker y el readiness probe de Kubernetes. */
  @Get()
  @Public()
  @HealthCheck()
  @ApiOperation({ summary: 'Estado del servicio y de la base de datos' })
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.db.pingCheck('database', { timeout: 3000 }),
      () => this.memory.checkHeap('memory_heap', 512 * 1024 * 1024),
    ]);
  }
}
