import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { ListCredential, ListViewer as ListViewerView } from '@navis/shared';

import { CurrentChurch } from '../common/decorators/current-church.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { ActiveChurchGuard } from '../common/guards/active-church.guard';
import {
  CreateListViewerDto,
  RegenerateListPasswordDto,
  SetListGrantsDto,
  UpdateListViewerDto,
} from './dto/list-viewer.dto';
import { ListDirectoryService } from './list-directory.service';
import { ListGrantsService } from './list-grants.service';
import { ListViewersService } from './list-viewers.service';
import { ListsService } from './lists.service';

/**
 * El **directorio de accesos** de la iglesia (RFC 0010 §7.2).
 *
 * Vive en ajustes y no colgando de una lista, porque un acceso es de la iglesia
 * y abre las listas que se le concedan (D19).
 *
 * **La contraseña en claro sale exactamente en dos respuestas de aquí** —crear y
 * regenerar— y en ninguna más: no hay ningún `GET` que la devuelva y
 * `listViewerSchema` no tiene el campo (D24).
 */
@ApiTags('listas')
@Controller('list-viewers')
@UseGuards(ActiveChurchGuard)
@RequirePermissions('lists.share')
export class ListViewersController {
  constructor(
    private readonly viewers: ListViewersService,
    private readonly directory: ListDirectoryService,
    private readonly grants: ListGrantsService,
    private readonly lists: ListsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'El directorio, con a cuántas listas llega cada uno' })
  list(@CurrentChurch() churchId: string): Promise<ListViewerView[]> {
    return this.directory.of(churchId);
  }

  @Post()
  @ApiOperation({ summary: 'Crear. Devuelve la contraseña en claro, una vez' })
  async create(
    @CurrentChurch() churchId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateListViewerDto,
  ): Promise<ListCredential> {
    const listIds = await this.lists.ownedIds(churchId, dto.listIds ?? []);
    const { viewer, password } = await this.viewers.create(churchId, { ...dto, listIds }, userId);

    return { viewer: await this.directory.one(viewer), password };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Etiqueta, activo, caducidad o creyente enlazado' })
  async update(
    @CurrentChurch() churchId: string,
    @Param('id') id: string,
    @Body() dto: UpdateListViewerDto,
  ): Promise<ListViewerView> {
    return this.directory.one(await this.viewers.update(churchId, id, dto));
  }

  @Post(':id/password')
  @ApiOperation({ summary: 'Regenerar. Devuelve la nueva y revoca las sesiones' })
  async regenerate(
    @CurrentChurch() churchId: string,
    @Param('id') id: string,
    @Body() dto: RegenerateListPasswordDto,
  ): Promise<ListCredential> {
    const password = await this.viewers.regenerate(churchId, id, dto.password);

    return { viewer: await this.directory.one(await this.viewers.require(churchId, id)), password };
  }

  @Put(':id/lists')
  @ApiOperation({ summary: 'Las listas que abre, de una vez (D19)' })
  async setLists(
    @CurrentChurch() churchId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: SetListGrantsDto,
  ): Promise<ListViewerView> {
    const viewer = await this.viewers.require(churchId, id);
    // Solo las listas de **esta** iglesia: sin este filtro, un identificador
    // inventado en el cuerpo concedería acceso a la lista de otra congregación.
    await this.grants.setForViewer(id, await this.lists.ownedIds(churchId, dto.ids), userId);

    return this.directory.one(viewer);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Borrado lógico. Revoca sesiones y quita concesiones' })
  remove(@CurrentChurch() churchId: string, @Param('id') id: string): Promise<void> {
    return this.viewers.remove(churchId, id);
  }
}
