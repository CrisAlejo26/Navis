import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Teaching } from './teaching.entity';
import { TeachingStatsService } from './teaching-stats.service';
import { TeachingsController } from './teachings.controller';
import { TeachingsPageService } from './teachings-page.service';
import { TeachingsRepository } from './teachings.repository';
import { TeachingsService } from './teachings.service';

/**
 * Las enseñanzas personales (RFC 0022).
 *
 * **No importa `ChurchesModule`**, igual que `PropheciesModule`: esto no
 * cuelga de la iglesia activa (D1 de la RFC 0004, mismo modelo aquí).
 */
@Module({
  imports: [TypeOrmModule.forFeature([Teaching])],
  controllers: [TeachingsController],
  providers: [TeachingsRepository, TeachingsService, TeachingsPageService, TeachingStatsService],
})
export class TeachingsModule {}
