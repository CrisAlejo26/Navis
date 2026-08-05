import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FulfillmentsController } from './fulfillments.controller';
import { FulfillmentsService } from './fulfillments.service';
import { PropheciesController } from './prophecies.controller';
import { PropheciesPageService } from './prophecies-page.service';
import { PropheciesRepository } from './prophecies.repository';
import { PropheciesService } from './prophecies.service';
import { ProphecyFulfillment } from './prophecy-fulfillment.entity';
import { ProphecyStatsService } from './prophecy-stats.service';
import { Prophecy } from './prophecy.entity';

/**
 * Las profecías personales (RFC 0004).
 *
 * **No importa `ChurchesModule`**, y ahí está la diferencia con todo lo demás:
 * esto no cuelga de la iglesia activa (D1). Tampoco exporta nada — nadie más
 * tiene por qué leer las profecías de nadie.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Prophecy, ProphecyFulfillment])],
  controllers: [PropheciesController, FulfillmentsController],
  providers: [
    PropheciesRepository,
    PropheciesService,
    PropheciesPageService,
    ProphecyStatsService,
    FulfillmentsService,
  ],
})
export class PropheciesModule {}
