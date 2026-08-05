import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  MAX_IMAGE_BYTES,
  type ListAccessEntry,
  type ListCredentialSheetRow,
  type ListShareState,
  type ListViewer as ListViewerView,
} from '@navis/shared';

import { CurrentChurch } from '../common/decorators/current-church.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { ActiveChurchGuard } from '../common/guards/active-church.guard';
import type { UploadedImage } from '../media/image-storage.service';
import { SetListGrantsDto } from './dto/list-viewer.dto';
import { ShareListDto } from './dto/share-list.dto';
import { ListDirectoryService } from './list-directory.service';
import { ListGrantsService } from './list-grants.service';
import { ListShareService } from './list-share.service';
import { ListStatsService } from './list-stats.service';
import { ListViewersBulkService } from './list-viewers-bulk.service';
import { ListViewersService } from './list-viewers.service';
import { ListsService } from './lists.service';

/**
 * Publicar una lista y repartir sus llaves (RFC 0010 D8).
 *
 * Todo va con `lists.share` y no con `lists.manage`: editar una lista y echarla
 * a internet no son la misma acción, y gestionar accesos es parte de abrir la
 * puerta.
 */
@ApiTags('listas')
@Controller('lists')
@UseGuards(ActiveChurchGuard)
@RequirePermissions('lists.share')
export class ListShareController {
  constructor(
    private readonly lists: ListsService,
    private readonly publishing: ListShareService,
    private readonly grants: ListGrantsService,
    private readonly directory: ListDirectoryService,
    private readonly bulk: ListViewersBulkService,
    private readonly stats: ListStatsService,
    private readonly viewers: ListViewersService,
  ) {}

  @Post(':id/share')
  @ApiOperation({ summary: 'Publicar: modo, token y enlace' })
  share(
    @CurrentChurch() churchId: string,
    @Param('id') id: string,
    @Body() dto: ShareListDto,
  ): Promise<ListShareState> {
    return this.publishing.share(churchId, id, dto);
  }

  @Post(':id/share/rotate')
  @ApiOperation({ summary: 'Cambiar el enlace sin despublicar (D11)' })
  rotate(@CurrentChurch() churchId: string, @Param('id') id: string): Promise<ListShareState> {
    return this.publishing.rotate(churchId, id);
  }

  @Delete(':id/share')
  @ApiOperation({ summary: 'Dejar de compartir. Borra el token y corta las sesiones' })
  unpublish(@CurrentChurch() churchId: string, @Param('id') id: string): Promise<ListShareState> {
    return this.publishing.unpublish(churchId, id);
  }

  /** La lámina la compone y rasteriza el navegador de quien comparte (D18). */
  @Post(':id/cover')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'La portada de la tarjeta de WhatsApp' })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_IMAGE_BYTES, files: 1 } }))
  async cover(
    @CurrentChurch() churchId: string,
    @Param('id') id: string,
    @UploadedFile() file: UploadedImage | undefined,
  ): Promise<void> {
    if (!file) throw new BadRequestException('No ha llegado ningún fichero');

    await this.publishing.setCover(churchId, id, file);
  }

  @Get(':id/access-log')
  @ApiOperation({ summary: 'Los últimos cincuenta intentos (D27)' })
  async accessLog(
    @CurrentChurch() churchId: string,
    @Param('id') id: string,
  ): Promise<ListAccessEntry[]> {
    await this.lists.require(churchId, id);
    return this.stats.recentAttempts(id);
  }

  @Put(':id/viewers')
  @ApiOperation({ summary: 'Quién entra en esta lista, de una vez (D19)' })
  async setViewers(
    @CurrentChurch() churchId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: SetListGrantsDto,
  ): Promise<ListViewerView[]> {
    await this.lists.require(churchId, id);
    // Solo accesos de **esta** iglesia: un identificador inventado en el cuerpo
    // no puede abrir la puerta a alguien de otra congregación.
    await this.grants.setForList(id, await this.viewers.ownedIds(churchId, dto.ids), userId);

    return this.directory.of(churchId);
  }

  @Post(':id/viewers/bulk')
  @ApiOperation({ summary: 'Dar acceso a los de esta lista, con su hoja (D29)' })
  async bulkGrant(
    @CurrentChurch() churchId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<ListCredentialSheetRow[]> {
    await this.lists.require(churchId, id);
    return this.bulk.run(churchId, id, userId);
  }
}
