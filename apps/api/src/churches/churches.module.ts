import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MediaModule } from '../media/media.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { ChurchMember } from './church-member.entity';
import { Church } from './church.entity';
import { ChurchClockService } from './church-clock.service';
import { ChurchesController } from './churches.controller';
import { ChurchesService } from './churches.service';
import { ChurchTransferService } from './church-transfer.service';

/**
 * Las iglesias y quién pertenece a cada una. Depende de `ProfilesModule`
 * porque la iglesia activa se guarda en el perfil (ver `Profile`), y de
 * `MediaModule` porque trasladar una iglesia mueve también sus ficheros
 * (`ChurchTransferService`). No importa `BelieversModule`/`CalendarModule`/
 * `ListsModule`: crearía un ciclo. `ChurchTransferService` llega a esas
 * entidades con el `EntityManager` de su propia transacción.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Church, ChurchMember]), ProfilesModule, MediaModule],
  controllers: [ChurchesController],
  providers: [ChurchesService, ChurchClockService, ChurchTransferService],
  exports: [ChurchesService, ChurchClockService, ChurchTransferService],
})
export class ChurchesModule {}
