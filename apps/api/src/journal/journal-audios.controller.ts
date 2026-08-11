import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MAX_AUDIO_BYTES, type JournalEntryAudio as AudioView } from '@navis/shared';
import type { Response } from 'express';

import { CurrentChurch } from '../common/decorators/current-church.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { ActiveChurchGuard } from '../common/guards/active-church.guard';
import { UploadAudioDto } from './dto/journal-entry.dto';
import { JournalAudiosService, type UploadedAudio } from './journal-audios.service';
import { JournalEntriesService } from './journal-entries.service';
import { toAudioView } from './journal-entries.mapper';

/**
 * Los audios de una entrada del cuaderno: grabados en la aplicación o
 * adjuntados ya hechos (RFC 0017 D7).
 *
 * **La descarga va bajo `/journal/audios/:id` y no bajo `/audios/:id`.** Esa
 * raíz ya está tomada por `NoteAudiosController` (RFC 0003), que no sabe nada
 * de este módulo: reutilizarla sin querer serviría un audio de creyentes con
 * el guard equivocado, o el segundo controlador nunca llegaría a registrarse.
 * Se prefija a propósito — ver `CLAUDE.md`.
 */
@ApiTags('cuaderno')
@Controller('journal')
@UseGuards(ActiveChurchGuard)
export class JournalAudiosController {
  constructor(
    private readonly audios: JournalAudiosService,
    private readonly entries: JournalEntriesService,
  ) {}

  @Post(':id/audios')
  @RequirePermissions('journal.manage')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Adjunta o sube un audio grabado' })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_AUDIO_BYTES, files: 1 } }))
  async upload(
    @CurrentChurch() churchId: string,
    @Param('id') entryId: string,
    @Body() dto: UploadAudioDto,
    @UploadedFile() file: UploadedAudio | undefined,
  ): Promise<AudioView> {
    if (!file) throw new BadRequestException('No ha llegado ningún fichero');

    await this.entries.require(churchId, entryId);

    const audio = await this.audios.add(churchId, entryId, file, {
      recorded: dto.recorded ?? false,
      durationSeconds: dto.durationSeconds ?? null,
    });

    return toAudioView(audio);
  }

  /**
   * Se devuelve un `StreamableFile` y **no** se hace `pipe` sobre la respuesta:
   * con `passthrough` Nest cierra la respuesta al volver del handler, y el
   * stream se queda a medias («Error: aborted»). `Res` queda solo para la
   * cabecera de caché.
   */
  @Get('audios/:id')
  @RequirePermissions('journal.view')
  @ApiOperation({ summary: 'Descarga el audio, si es de esta iglesia' })
  async download(
    @CurrentChurch() churchId: string,
    @Param('id') id: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const { audio, file } = await this.audios.stream(churchId, id);

    // Un año: el contenido de un audio no cambia nunca, y `private` deja claro
    // que no lo puede guardar un proxy compartido.
    response.setHeader('Cache-Control', 'private, max-age=31536000, immutable');

    return new StreamableFile(file, { type: audio.mimeType, length: audio.sizeBytes });
  }

  @Delete(':id/audios/:audioId')
  @RequirePermissions('journal.manage')
  @ApiOperation({ summary: 'Quita el audio y borra su fichero del disco' })
  async remove(
    @CurrentChurch() churchId: string,
    @Param('id') entryId: string,
    @Param('audioId') audioId: string,
  ): Promise<void> {
    await this.entries.require(churchId, entryId);
    await this.audios.remove(churchId, audioId);
  }
}
