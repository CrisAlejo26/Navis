import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { DEFAULT_ROLE, type MyRole, type Paginated, type RoleRow } from '@navis/shared';

import type { AuthUser } from '../auth/auth';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
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

  // Lo suyo lo puede consultar cualquiera con sesión: es lo que decide qué
  // entradas del menú se pintan, y esconder el propio rol no protege nada.
  @Get('mine')
  @ApiOperation({ summary: 'El rol de quien pregunta, con sus permisos' })
  @ApiOkResponse({ description: 'Slug y permisos' })
  mine(@CurrentUser() user: AuthUser): Promise<MyRole> {
    return this.roles.mine(user.role ?? DEFAULT_ROLE);
  }

  @Post()
  @RequirePermissions('roles.manage')
  @ApiOperation({ summary: 'Crea un rol propio de la instalación' })
  @ApiCreatedResponse({ description: 'El rol creado' })
  create(@Body() dto: CreateRoleDto): Promise<RoleRow> {
    return this.admin.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('roles.manage')
  @ApiOperation({ summary: 'Cambia un rol. De los de serie, la descripción y los permisos' })
  @ApiOkResponse({ description: 'El rol actualizado' })
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto): Promise<RoleRow> {
    return this.admin.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('roles.manage')
  @HttpCode(204)
  @ApiOperation({ summary: 'Borra un rol propio que no tenga cuentas' })
  @ApiNoContentResponse()
  remove(@Param('id') id: string): Promise<void> {
    return this.admin.remove(id);
  }
}
