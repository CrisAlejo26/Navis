import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProfilesModule } from '../profiles/profiles.module';
import { ChurchMember } from './church-member.entity';
import { Church } from './church.entity';
import { ChurchesController } from './churches.controller';
import { ChurchesService } from './churches.service';

/**
 * Las iglesias y quién pertenece a cada una. Depende de `ProfilesModule`
 * porque la iglesia activa se guarda en el perfil (ver `Profile`).
 */
@Module({
  imports: [TypeOrmModule.forFeature([Church, ChurchMember]), ProfilesModule],
  controllers: [ChurchesController],
  providers: [ChurchesService],
  exports: [ChurchesService],
})
export class ChurchesModule {}
