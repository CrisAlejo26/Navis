import { Body, Controller, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DEFAULT_ROLE, type MyChurches } from '@navis/shared';

import type { AuthUser } from '../auth/auth';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Church } from './church.entity';
import { ChurchesService } from './churches.service';
import { CreateChurchDto } from './dto/create-church.dto';
import { SetActiveChurchDto } from './dto/set-active-church.dto';
import { UpdateChurchDto } from './dto/update-church.dto';

@ApiTags('iglesias')
@Controller('churches')
export class ChurchesController {
  constructor(private readonly churches: ChurchesService) {}

  /**
   * Las iglesias a las que llega quien pregunta y en cuál está trabajando.
   *
   * No exige permiso: es lo que consulta la aplicación nada más entrar para
   * saber si hay que pedir la primera iglesia. Sin acceso a ninguna, la lista
   * viene vacía, que es la respuesta correcta y no un 403.
   */
  @Get()
  @ApiOperation({ summary: 'Mis iglesias, con la activa marcada' })
  @ApiOkResponse({ description: 'Listado y iglesia activa' })
  findMine(@CurrentUser() user: AuthUser): Promise<MyChurches> {
    return this.churches.listFor(asker(user));
  }

  @Post()
  @RequirePermissions('churches.manage')
  @ApiOperation({ summary: 'Crea una iglesia y la deja como activa' })
  @ApiCreatedResponse({ description: 'La iglesia creada' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateChurchDto): Promise<Church> {
    return this.churches.create(asker(user), dto);
  }

  @Patch(':id')
  @RequirePermissions('churches.manage')
  @ApiOperation({ summary: 'Cambia el nombre, la ciudad o la zona horaria' })
  @ApiOkResponse({ description: 'La iglesia actualizada' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateChurchDto,
  ): Promise<Church> {
    return this.churches.update(asker(user), id, dto);
  }

  @Put('active')
  @ApiOperation({ summary: 'Cambia la iglesia sobre la que se trabaja' })
  @ApiOkResponse({ description: 'Listado con la nueva activa' })
  setActive(@CurrentUser() user: AuthUser, @Body() dto: SetActiveChurchDto): Promise<MyChurches> {
    return this.churches.setActive(asker(user), dto.churchId);
  }
}

/** Lo mínimo del usuario que necesita el servicio para decidir a qué llega. */
const asker = (user: AuthUser) => ({ id: user.id, role: user.role ?? DEFAULT_ROLE });
