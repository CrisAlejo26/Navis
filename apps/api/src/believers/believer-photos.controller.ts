import {
  BadRequestException,
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
import { MAX_IMAGE_BYTES, type Believer as BelieverView } from '@navis/shared';
import type { Response } from 'express';

import { CurrentChurch } from '../common/decorators/current-church.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { ActiveChurchGuard } from '../common/guards/active-church.guard';
import { BelieverPhotosService, type UploadedImage } from './believer-photos.service';
import { toBelieverView } from './believers.mapper';

/**
 * La fotografía de un creyente. Opcional del todo: quien no la suba no la echa
 * de menos, porque la ficha no reserva hueco para ella.
 *
 * **Descargar cuelga de la raíz** (`/believer-photos/:id`), como los audios:
 * un `<img src>` es una petición suelta del navegador y no tiene por qué
 * repetir toda la ruta. El guard de iglesia sigue delante.
 */
@ApiTags('creyentes')
@Controller()
@UseGuards(ActiveChurchGuard)
export class BelieverPhotosController {
  constructor(private readonly photos: BelieverPhotosService) {}

  @Post('believers/:id/photo')
  @RequirePermissions('believers.manage')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Sube o reemplaza la fotografía' })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_IMAGE_BYTES, files: 1 } }))
  async upload(
    @CurrentChurch() churchId: string,
    @Param('id') id: string,
    @UploadedFile() file: UploadedImage | undefined,
  ): Promise<BelieverView> {
    if (!file) throw new BadRequestException('No ha llegado ningún fichero');

    return toBelieverView(await this.photos.set(churchId, id, file));
  }

  /**
   * Se devuelve un `StreamableFile` y **no** se hace `pipe` sobre la respuesta:
   * con `passthrough` Nest cierra la respuesta al volver del handler y el
   * stream se queda a medias (CLAUDE.md). `Res` queda solo para la cabecera.
   */
  @Get('believer-photos/:id')
  @RequirePermissions('believers.view')
  @ApiOperation({ summary: 'Descarga la fotografía, si es de esta iglesia' })
  async download(
    @CurrentChurch() churchId: string,
    @Param('id') id: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const { file, mimeType } = await this.photos.stream(churchId, id);

    // Corta, y `private`: la foto **sí cambia** cuando alguien la reemplaza, y
    // un año de caché dejaría la vieja puesta hasta vaciar el navegador.
    response.setHeader('Cache-Control', 'private, max-age=60');

    return new StreamableFile(file, { type: mimeType });
  }

  @Delete('believers/:id/photo')
  @RequirePermissions('believers.manage')
  @ApiOperation({ summary: 'Quita la fotografía y borra el fichero del disco' })
  async remove(@CurrentChurch() churchId: string, @Param('id') id: string): Promise<BelieverView> {
    return toBelieverView(await this.photos.remove(churchId, id));
  }
}
