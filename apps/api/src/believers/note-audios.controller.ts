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
import { MAX_AUDIO_BYTES, type NoteAudio as AudioView } from '@navis/shared';
import type { Response } from 'express';

import { CurrentChurch } from '../common/decorators/current-church.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { ActiveChurchGuard } from '../common/guards/active-church.guard';
import { BelieverNotesService } from './believer-notes.service';
import { BelieversService } from './believers.service';
import { UploadAudioDto } from './dto/note.dto';
import { NoteAudiosService, type UploadedAudio } from './note-audios.service';
import { toAudioView } from './notes.mapper';

/**
 * Los audios de una nota: grabados en la aplicación o adjuntados ya hechos.
 *
 * Subir y borrar cuelgan de su nota —y por tanto de su creyente—, así que el
 * alcance se comprueba resolviendo los dos. **Descargar cuelga de la raíz**
 * (`/audios/:id`) porque un `<audio src>` es una petición suelta del navegador
 * y no tiene por qué repetir toda la ruta; el guard de iglesia sigue delante y
 * el servicio comprueba que ese audio es de esta congregación.
 */
@ApiTags('creyentes')
@Controller()
@UseGuards(ActiveChurchGuard)
export class NoteAudiosController {
  constructor(
    private readonly audios: NoteAudiosService,
    private readonly notes: BelieverNotesService,
    private readonly believers: BelieversService,
  ) {}

  @Post('believers/:id/notes/:noteId/audios')
  @RequirePermissions('believers.manage')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Adjunta o sube un audio grabado' })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_AUDIO_BYTES, files: 1 } }))
  async upload(
    @CurrentChurch() churchId: string,
    @Param('id') believerId: string,
    @Param('noteId') noteId: string,
    @Body() dto: UploadAudioDto,
    @UploadedFile() file: UploadedAudio | undefined,
  ): Promise<AudioView> {
    if (!file) throw new BadRequestException('No ha llegado ningún fichero');

    await this.believers.require(churchId, believerId);
    await this.notes.require(believerId, noteId);

    const audio = await this.audios.add(churchId, noteId, file, {
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
  @RequirePermissions('believers.view')
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

  @Delete('believers/:id/notes/:noteId/audios/:audioId')
  @RequirePermissions('believers.manage')
  @ApiOperation({ summary: 'Quita el audio y borra su fichero del disco' })
  async remove(
    @CurrentChurch() churchId: string,
    @Param('id') believerId: string,
    @Param('noteId') noteId: string,
    @Param('audioId') audioId: string,
  ): Promise<void> {
    await this.believers.require(churchId, believerId);
    await this.notes.require(believerId, noteId);
    await this.audios.remove(churchId, audioId);
  }
}
