import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { GeocodedCities } from '@navis/shared';

import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { GeocodeService } from './geocode.service';

@ApiTags('geocodificación')
@Controller('geocode')
export class GeocodeController {
  constructor(private readonly geocode: GeocodeService) {}

  /**
   * Ciudades que coinciden con lo escrito, para el selector geográfico de la
   * ficha de una iglesia (RFC 0011, ampliación).
   *
   * Tras `churches.manage` —el mismo permiso que edita la iglesia— para que
   * no sea un buscador de ciudades abierto a cualquiera con sesión.
   */
  @Get('cities')
  @RequirePermissions('churches.manage')
  @ApiOperation({ summary: 'Busca ciudades por nombre, con su comunidad y zona horaria' })
  @ApiOkResponse({ description: 'Las que coinciden, vacío si el proveedor falla' })
  async cities(
    @Query('q') query: string | undefined,
    @Query('country') country: string | undefined,
  ): Promise<GeocodedCities> {
    const trimmed = query?.trim() ?? '';
    if (trimmed.length < 2) return { items: [] };

    return { items: await this.geocode.searchCities(trimmed, country?.trim() || undefined) };
  }
}
