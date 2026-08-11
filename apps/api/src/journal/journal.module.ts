import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ChurchesModule } from '../churches/churches.module';
import { MediaModule } from '../media/media.module';
import { UsersModule } from '../users/users.module';
import { JournalAudiosController } from './journal-audios.controller';
import { JournalAudiosService } from './journal-audios.service';
import { JournalEntriesService } from './journal-entries.service';
import { JournalEntriesViewService } from './journal-entries-view.service';
import { JournalEntryAudio } from './journal-entry-audio.entity';
import { JournalEntry } from './journal-entry.entity';
import { JournalExportService } from './journal-export.service';
import { JournalPageService } from './journal-page.service';
import { JournalStatsService } from './journal-stats.service';
import { JournalController } from './journal.controller';

/**
 * El cuaderno de la iglesia, con sus audios (RFC 0017).
 *
 * Depende de `ChurchesModule` porque `ActiveChurchGuard` necesita resolver la
 * iglesia activa, y de `UsersModule` para firmar cada entrada con el nombre de
 * quien la escribió — mismas dependencias que `BelieversModule` (RFC 0003), y
 * por el mismo motivo.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([JournalEntry, JournalEntryAudio]),
    ChurchesModule,
    UsersModule,
    MediaModule,
  ],
  controllers: [JournalController, JournalAudiosController],
  providers: [
    JournalEntriesService,
    JournalEntriesViewService,
    JournalPageService,
    JournalStatsService,
    JournalExportService,
    JournalAudiosService,
  ],
})
export class JournalModule {}
