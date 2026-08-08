import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ChurchesModule } from '../churches/churches.module';
import { MediaModule } from '../media/media.module';
import { UsersModule } from '../users/users.module';
import { BelieverGift } from './believer-gift.entity';
import { BelieverHistoryService } from './believer-history.service';
import { BelieverLinksService } from './believer-links.service';
import { BelieverMinistry } from './believer-ministry.entity';
import { BelieverPhotosController } from './believer-photos.controller';
import { BelieverPhotosService } from './believer-photos.service';
import { BelieverNote } from './believer-note.entity';
import { BelieverNotesController } from './believer-notes.controller';
import { BelieverNotesService } from './believer-notes.service';
import { BelieverRowsService } from './believer-rows.service';
import { Believer } from './believer.entity';
import { BelieversExportService } from './believers-export.service';
import { BelieversPageService } from './believers-page.service';
import { BelieversRosterService } from './believers-roster.service';
import { BelieversSummaryService } from './believers-summary.service';
import { BelieversController } from './believers.controller';
import { BelieversService } from './believers.service';
import { Gift } from './gift.entity';
import { GiftsController } from './gifts.controller';
import { GiftsService } from './gifts.service';
import { MinistriesController } from './ministries.controller';
import { MinistriesService } from './ministries.service';
import { Ministry } from './ministry.entity';
import { NoteAudio } from './note-audio.entity';
import { NoteAudiosController } from './note-audios.controller';
import { NoteAudiosService } from './note-audios.service';
import { NotesViewService } from './notes-view.service';

/**
 * Los creyentes, su bitácora con audios y el catálogo de dones (RFC 0003).
 *
 * Depende de `ChurchesModule` porque `ActiveChurchGuard` necesita resolver la
 * iglesia activa y el aviso necesita saber qué día es allí; y de `UsersModule`
 * para firmar cada nota con el nombre de quien la escribió.
 *
 * Solo exporta lo que consume el calendario: la lista llana de personas y la
 * ficha. Ni la bitácora ni los dones salen de aquí (RFC 0002 D10: programar un
 * turno no puede obligar a abrir la ficha pastoral de nadie).
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Believer,
      BelieverMinistry,
      Gift,
      BelieverGift,
      BelieverNote,
      NoteAudio,
      Ministry,
    ]),
    ChurchesModule,
    UsersModule,
    MediaModule,
  ],
  controllers: [
    BelieversController,
    BelieverNotesController,
    NoteAudiosController,
    GiftsController,
    MinistriesController,
    BelieverPhotosController,
  ],
  providers: [
    BelieversService,
    BelieversRosterService,
    BelieverRowsService,
    BelieversPageService,
    BelieversExportService,
    BelieversSummaryService,
    BelieverLinksService,
    BelieverNotesService,
    BelieverHistoryService,
    NotesViewService,
    NoteAudiosService,
    GiftsService,
    MinistriesService,
    BelieverPhotosService,
  ],
  // `BelieverPhotosService` sale porque la página pública de una lista sirve la
  // foto por su propia puerta, con sus cinco cierres (RFC 0010 D17).
  // `BelieversPageService` y `BelieversSummaryService` salen para el panel de
  // inicio (RFC 0001): la vista previa de «quién pide atención» es la misma
  // consulta que el listado, y no hay motivo para volver a escribirla.
  exports: [
    BelieversService,
    BelieversRosterService,
    BelieverPhotosService,
    BelieversPageService,
    BelieversSummaryService,
  ],
})
export class BelieversModule {}
