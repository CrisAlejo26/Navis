import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Weather } from '@navis/shared';

import type { AuthUser } from '../auth/auth';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ProfilesService } from '../profiles/profiles.service';
import { WeatherService } from './weather.service';

@ApiTags('tiempo')
@Controller('weather')
export class WeatherController {
  constructor(
    private readonly weather: WeatherService,
    private readonly profiles: ProfilesService,
  ) {}

  /**
   * El tiempo donde lo haya configurado quien pregunta.
   *
   * La ciudad la pone el servidor desde el perfil y no el cliente: así el
   * endpoint no es un buscador de ciudades para cualquiera con sesión, y no
   * hace falta pasarla en cada consulta.
   *
   * Sin ciudad configurada devuelve `null`, no un error: que no se haya dicho
   * de dónde es un estado normal, y el panel lo enseña invitando a ponerla.
   */
  @Get()
  @ApiOperation({ summary: 'El tiempo de la ciudad del perfil' })
  @ApiOkResponse({ description: 'Temperatura y estado del cielo, o null' })
  async mine(@CurrentUser() user: AuthUser): Promise<Weather | null> {
    const profile = await this.profiles.findOrCreate(user.id);
    const city = profile.city?.trim();
    if (!city) return null;

    return this.weather.forCity(city);
  }
}
