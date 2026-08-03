import { Module } from '@nestjs/common';

import { ProfilesModule } from '../profiles/profiles.module';
import { WeatherController } from './weather.controller';
import { WeatherService } from './weather.service';

/** El tiempo del panel de inicio. La ciudad sale del perfil de cada cual. */
@Module({
  imports: [ProfilesModule],
  controllers: [WeatherController],
  providers: [WeatherService],
})
export class WeatherModule {}
