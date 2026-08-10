import {
  BadRequestException,
  Body,
  Controller,
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
import { MAX_FILE_BYTES, type Message } from '@navis/shared';
import type { Response } from 'express';

import { CurrentChurch } from '../common/decorators/current-church.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { ActiveChurchGuard } from '../common/guards/active-church.guard';
import { type UploadedAttachment, AttachmentsService } from './attachments.service';
import { UploadAttachmentDto } from './dto/message.dto';

/**
 * Los adjuntos de un mensaje: imágenes y archivos.
 *
 * Subir cuelga de su canal (`/channels/:id/attachments`), como
 * `NoteAudiosController`; descargar cuelga de la raíz (`/attachments/:id`)
 * porque una `<img src>` o un enlace de descarga son peticiones sueltas del
 * navegador que no repiten toda la ruta.
 */
@ApiTags('comunicaciones')
@Controller()
@UseGuards(ActiveChurchGuard)
@RequirePermissions('communications.view')
export class AttachmentsController {
  constructor(private readonly attachments: AttachmentsService) {}

  @Post('channels/:id/attachments')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Envía un mensaje con un adjunto: imagen o archivo' })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_FILE_BYTES, files: 1 } }))
  async upload(
    @CurrentChurch() churchId: string,
    @CurrentUser('id') userId: string,
    @Param('id') channelId: string,
    @Body() dto: UploadAttachmentDto,
    @UploadedFile() file: UploadedAttachment | undefined,
  ): Promise<Message> {
    if (!file) throw new BadRequestException('No ha llegado ningún fichero');

    return this.attachments.upload(churchId, userId, channelId, file, {
      body: dto.body,
      replyToId: dto.replyToId,
    });
  }

  /**
   * `StreamableFile`, sin `pipe` sobre la respuesta: con `passthrough` Nest
   * cierra la respuesta al volver del handler (CLAUDE.md).
   */
  @Get('attachments/:id')
  @ApiOperation({ summary: 'Descarga el adjunto, si es de esta iglesia' })
  async download(
    @CurrentChurch() churchId: string,
    @Param('id') id: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const { attachment, file } = await this.attachments.stream(churchId, id);

    response.setHeader('Cache-Control', 'private, max-age=31536000, immutable');
    response.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(attachment.originalName)}"`,
    );

    return new StreamableFile(file, { type: attachment.mimeType, length: attachment.sizeBytes });
  }
}
