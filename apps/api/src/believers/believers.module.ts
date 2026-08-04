import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ChurchesModule } from '../churches/churches.module';
import { BelieverMinistry } from './believer-ministry.entity';
import { Believer } from './believer.entity';
import { BelieversController } from './believers.controller';
import { BelieversService } from './believers.service';

/**
 * El núcleo mínimo de creyentes (RFC 0002 §6). Depende de `ChurchesModule`
 * porque `ActiveChurchGuard` necesita resolver la iglesia activa.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Believer, BelieverMinistry]), ChurchesModule],
  controllers: [BelieversController],
  providers: [BelieversService],
  exports: [BelieversService],
})
export class BelieversModule {}
