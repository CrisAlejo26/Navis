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
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MAX_AUDIO_BYTES, type DreamAudio as AudioView } from '@navis/shared';
import type { Response } from 'express';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { DreamAudiosService, type UploadedAudio } from './dream-audios.service';
import { toDreamAudioView } from './dreams.mapper';
import { UploadDreamAudioDto } from './dto/dream.dto';

/**
 * Los audios de un sueño: grabados al despertar o adjuntados ya hechos.
 *
 * Subir cuelga de su sueño; **descargar cuelga de la raíz**
 * (`/dream-audios/:id`) porque un `<audio src>` es una petición suelta del
 * navegador y no tiene por qué repetir toda la ruta. En las dos, quien manda es
 * el dueño del sueño (D1): aquí no hay permisos de rol ni guard de iglesia.
 */
@ApiTags('suenos')
@Controller()
export class DreamAudiosController {
  constructor(private readonly audios: DreamAudiosService) {}

  @Post('dreams/:id/audios')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Adjunta o sube un audio grabado' })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_AUDIO_BYTES, files: 1 } }))
  async upload(
    @CurrentUser('id') ownerId: string,
    @Param('id') dreamId: string,
    @Body() dto: UploadDreamAudioDto,
    @UploadedFile() file: UploadedAudio | undefined,
  ): Promise<AudioView> {
    if (!file) throw new BadRequestException('No ha llegado ningún fichero');

    const audio = await this.audios.add(ownerId, dreamId, file, {
      recorded: dto.recorded ?? false,
      durationSeconds: dto.durationSeconds ?? null,
    });

    return toDreamAudioView(audio);
  }

  /**
   * Se devuelve un `StreamableFile` y **no** se hace `pipe` sobre la respuesta:
   * con `passthrough` Nest cierra la respuesta al volver del handler, y el
   * stream se queda a medias («Error: aborted»). `Res` queda solo para la
   * cabecera de caché.
   */
  @Get('dream-audios/:id')
  @ApiOperation({ summary: 'Descarga el audio, si el sueño es tuyo' })
  async download(
    @CurrentUser('id') ownerId: string,
    @Param('id') id: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const { audio, file } = await this.audios.stream(ownerId, id);

    // Un año: el contenido de un audio no cambia nunca, y `private` deja claro
    // que no lo puede guardar un proxy compartido.
    response.setHeader('Cache-Control', 'private, max-age=31536000, immutable');

    return new StreamableFile(file, { type: audio.mimeType, length: audio.sizeBytes });
  }

  @Delete('dream-audios/:id')
  @ApiOperation({ summary: 'Quita el audio y borra su fichero del disco' })
  remove(@CurrentUser('id') ownerId: string, @Param('id') id: string): Promise<void> {
    return this.audios.remove(ownerId, id);
  }
}
