import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { ManagedUser, Paginated } from '@navis/shared';

import type { AuthUser } from '../auth/auth';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateManagedUserDto } from './dto/create-managed-user.dto';
import { ManagedUsersQueryDto } from './dto/managed-users-query.dto';
import { SetUserPasswordDto } from './dto/set-user-password.dto';
import { UpdateManagedUserDto } from './dto/update-managed-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UserAdminService } from './user-admin.service';
import { UsersService } from './users.service';

/** Administración de accesos. Solo para el rol `admin` (ver RolesGuard). */
@ApiTags('usuarios')
@Roles('admin')
@Controller('admin/users')
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly admin: UserAdminService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Cuentas, con búsqueda, filtro por rol, orden y paginación' })
  @ApiOkResponse({ description: 'Página de usuarios' })
  findAll(@Query() query: ManagedUsersQueryDto): Promise<Paginated<ManagedUser>> {
    return this.users.findPage(query);
  }

  @Post()
  @ApiOperation({ summary: 'Crea una cuenta con su rol' })
  @ApiCreatedResponse({ description: 'La cuenta creada' })
  create(@Body() dto: CreateManagedUserDto): Promise<ManagedUser> {
    return this.admin.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cambia el nombre, el correo o el rol de una cuenta' })
  @ApiOkResponse({ description: 'La cuenta actualizada' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateManagedUserDto,
    @CurrentUser() actor: AuthUser,
  ): Promise<ManagedUser> {
    return this.admin.update(id, dto, actor.id);
  }

  @Patch(':id/role')
  @ApiOperation({ summary: 'Cambia solo el rol de una cuenta' })
  @ApiOkResponse({ description: 'La cuenta con su rol nuevo' })
  updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser() actor: AuthUser,
  ): Promise<ManagedUser> {
    return this.admin.setRole(id, dto.role, actor.id);
  }

  @Patch(':id/password')
  @HttpCode(204)
  @ApiOperation({ summary: 'Pone una contraseña nueva y cierra sus sesiones' })
  @ApiNoContentResponse()
  setPassword(
    @Param('id') id: string,
    @Body() dto: SetUserPasswordDto,
    @CurrentUser() actor: AuthUser,
  ): Promise<void> {
    return this.admin.setPassword(id, dto.password, actor.id);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Da de baja la cuenta con todo lo suyo' })
  @ApiNoContentResponse()
  remove(@Param('id') id: string, @CurrentUser() actor: AuthUser): Promise<void> {
    return this.admin.remove(id, actor.id);
  }
}
