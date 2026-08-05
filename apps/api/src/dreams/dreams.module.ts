import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MediaModule } from '../media/media.module';
import { DreamAudio } from './dream-audio.entity';
import { DreamAudiosController } from './dream-audios.controller';
import { DreamAudiosService } from './dream-audios.service';
import { DreamEmotion } from './dream-emotion.entity';
import { DreamEmotionsRepository } from './dream-emotions.repository';
import { DreamRowsService } from './dream-rows.service';
import { DreamStatsService } from './dream-stats.service';
import { Dream } from './dream.entity';
import { DreamsExportService } from './dreams-export.service';
import { DreamsPageService } from './dreams-page.service';
import { DreamsController } from './dreams.controller';
import { DreamsRepository } from './dreams.repository';
import { DreamsService } from './dreams.service';
import { Emotion } from './emotion.entity';
import { EmotionsController } from './emotions.controller';
import { EmotionsRepository } from './emotions.repository';
import { EmotionsService } from './emotions.service';

/**
 * Los sueños personales (RFC 0005).
 *
 * **No importa `ChurchesModule`**, y ahí está la diferencia con todo lo demás:
 * esto no es de una iglesia, es de cada usuario (D1). Sí importa `MediaModule`,
 * que es de donde sale el almacén de audios compartido con las notas (D13).
 *
 * `EmotionsController` va **antes** que `DreamsController`: Nest resuelve las
 * rutas en el orden en que se registran, y con `dreams/:id` por delante,
 * `dreams/emotions` se leería como un sueño con identificador «emotions».
 */
@Module({
  imports: [TypeOrmModule.forFeature([Dream, Emotion, DreamEmotion, DreamAudio]), MediaModule],
  controllers: [EmotionsController, DreamsController, DreamAudiosController],
  providers: [
    DreamsRepository,
    EmotionsRepository,
    DreamEmotionsRepository,
    DreamsService,
    DreamRowsService,
    DreamsPageService,
    DreamsExportService,
    DreamStatsService,
    EmotionsService,
    DreamAudiosService,
  ],
})
export class DreamsModule {}
