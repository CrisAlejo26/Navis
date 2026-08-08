import { Module } from '@nestjs/common';

import { GeocodeController } from './geocode.controller';
import { GeocodeService } from './geocode.service';

/** La búsqueda de ciudades del selector geográfico (RFC 0011, ampliación). */
@Module({
  controllers: [GeocodeController],
  providers: [GeocodeService],
})
export class GeocodeModule {}
