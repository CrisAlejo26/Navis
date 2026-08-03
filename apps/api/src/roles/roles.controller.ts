import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Paginated, RoleRow } from '@navis/shared';

import { Roles } from '../common/decorators/roles.decorator';
import { CreateRoleDto } from './dto/create-role.dto';
import { RolesQueryDto } from './dto/roles-query.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleAdminService } from './role-admin.service';
import { RolesService } from './roles.service';

@ApiTags('roles')
@Controller('roles')
export class RolesController {
  constructor(
    private readonly roles: RolesService,
    private readonly admin: RoleAdminService,
  ) {}

  // El catálogo lo puede leer cualquiera con sesión: la interfaz lo necesita
  // para poner nombre al rol de cada persona.
  @Get()
  @ApiOperation({ summary: 'Catálogo de roles con el número de cuentas de cada uno' })
  @ApiOkResponse({ description: 'Página de roles' })
  findAll(@Query() query: RolesQueryDto): Promise<Paginated<RoleRow>> {
    return this.roles.findPage(query);
  }

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Crea un rol propio de la instalación' })
  @ApiCreatedResponse({ description: 'El rol creado' })
  create(@Body() dto: CreateRoleDto): Promise<RoleRow> {
    return this.admin.create(dto);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Cambia un rol. De los de serie, solo la descripción' })
  @ApiOkResponse({ description: 'El rol actualizado' })
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto): Promise<RoleRow> {
    return this.admin.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(204)
  @ApiOperation({ summary: 'Borra un rol propio que no tenga cuentas' })
  @ApiNoContentResponse()
  remove(@Param('id') id: string): Promise<void> {
    return this.admin.remove(id);
  }
}
