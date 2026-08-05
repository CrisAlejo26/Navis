import { Body, Controller, Delete, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { ListMember as ListMemberView } from '@navis/shared';

import { CurrentChurch } from '../common/decorators/current-church.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { ActiveChurchGuard } from '../common/guards/active-church.guard';
import { AddListMembersDto, ReorderListDto, UpdateListMemberDto } from './dto/list-member.dto';
import { ListMembersService } from './list-members.service';
import { ListRowsService } from './list-rows.service';
import { ListsService } from './lists.service';

/**
 * Quién está en una lista y en qué orden (RFC 0010 D5, D6).
 *
 * Todas devuelven **la lista de miembros entera y ya ordenada**: son decenas de
 * personas, no miles, y así la pantalla no tiene que recomponer el orden por su
 * cuenta después de arrastrar una fila.
 */
@ApiTags('listas')
@Controller('lists')
@UseGuards(ActiveChurchGuard)
export class ListMembersController {
  constructor(
    private readonly lists: ListsService,
    private readonly members: ListMembersService,
    private readonly rows: ListRowsService,
  ) {}

  @Post(':id/members')
  @RequirePermissions('lists.manage')
  @ApiOperation({ summary: 'Añade varias personas de golpe' })
  async add(
    @CurrentChurch() churchId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: AddListMembersDto,
  ): Promise<ListMemberView[]> {
    await this.lists.require(churchId, id);
    await this.members.add(churchId, id, dto.believerIds, userId);

    return this.rows.view(id);
  }

  @Patch(':id/members/:believerId')
  @RequirePermissions('lists.manage')
  @ApiOperation({ summary: 'La nota de esa persona en esta lista' })
  async note(
    @CurrentChurch() churchId: string,
    @Param('id') id: string,
    @Param('believerId') believerId: string,
    @Body() dto: UpdateListMemberDto,
  ): Promise<ListMemberView[]> {
    await this.lists.require(churchId, id);
    await this.members.setNote(id, believerId, dto.note ?? null);

    return this.rows.view(id);
  }

  @Delete(':id/members/:believerId')
  @RequirePermissions('lists.manage')
  @ApiOperation({ summary: 'Quita a una persona de la lista' })
  async remove(
    @CurrentChurch() churchId: string,
    @Param('id') id: string,
    @Param('believerId') believerId: string,
  ): Promise<void> {
    await this.lists.require(churchId, id);
    await this.members.remove(id, believerId);
  }

  @Put(':id/order')
  @RequirePermissions('lists.manage')
  @ApiOperation({ summary: 'El orden entero, de una vez (D6)' })
  async reorder(
    @CurrentChurch() churchId: string,
    @Param('id') id: string,
    @Body() dto: ReorderListDto,
  ): Promise<ListMemberView[]> {
    await this.lists.require(churchId, id);
    await this.members.reorder(id, dto.believerIds);

    return this.rows.view(id);
  }
}
