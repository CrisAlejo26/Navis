import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { DEFAULT_ROLE, type ManagedUser, type Paginated } from '@navis/shared';

import type { AuthUser } from '../auth/auth';
import { ChurchesService } from '../churches/churches.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CreateManagedUserDto } from './dto/create-managed-user.dto';
import { ManagedUsersQueryDto } from './dto/managed-users-query.dto';
import { RemoveUserDto } from './dto/remove-user.dto';
import { SetUserPasswordDto } from './dto/set-user-password.dto';
import { UpdateManagedUserDto } from './dto/update-managed-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UserAdminService } from './user-admin.service';
import { UsersService } from './users.service';

/**
 * Administración de accesos. Leer la lista pide `users.view`; cambiar algo,
 * `users.manage` (ver PermissionsGuard).
 */
@ApiTags('usuarios')
@RequirePermissions('users.view')
@Controller('admin/users')
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly admin: UserAdminService,
    private readonly churches: ChurchesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Cuentas, con búsqueda, filtro por rol, orden y paginación' })
  @ApiOkResponse({ description: 'Página de usuarios' })
  async findAll(
    @Query() query: ManagedUsersQueryDto,
    @CurrentUser() user: AuthUser,
  ): Promise<Paginated<ManagedUser>> {
    // El alcance lo pone el servidor a partir de quién pregunta; el `churchId`
    // de la query solo puede acotarlo más, nunca ampliarlo.
    const scope = await this.churches.scopeFor(asker(user), query.churchIds);
    return this.users.findPage(query, scope);
  }

  @Post()
  @RequirePermissions('users.manage')
  @ApiOperation({ summary: 'Crea una cuenta con su rol' })
  @ApiCreatedResponse({ description: 'La cuenta creada' })
  create(@Body() dto: CreateManagedUserDto, @CurrentUser() user: AuthUser): Promise<ManagedUser> {
    return this.admin.create(dto, asker(user));
  }

  @Patch(':id')
  @RequirePermissions('users.manage')
  @ApiOperation({ summary: 'Cambia el nombre, el correo o el rol de una cuenta' })
  @ApiOkResponse({ description: 'La cuenta actualizada' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateManagedUserDto,
    @CurrentUser() actor: AuthUser,
  ): Promise<ManagedUser> {
    return this.admin.update(id, dto, asker(actor));
  }

  @Patch(':id/role')
  @RequirePermissions('users.manage')
  @ApiOperation({ summary: 'Cambia solo el rol de una cuenta' })
  @ApiOkResponse({ description: 'La cuenta con su rol nuevo' })
  updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser() actor: AuthUser,
  ): Promise<ManagedUser> {
    return this.admin.setRole(id, dto.role, asker(actor));
  }

  @Patch(':id/password')
  @RequirePermissions('users.manage')
  @HttpCode(204)
  @ApiOperation({ summary: 'Pone una contraseña nueva y cierra sus sesiones' })
  @ApiNoContentResponse()
  setPassword(
    @Param('id') id: string,
    @Body() dto: SetUserPasswordDto,
    @CurrentUser() actor: AuthUser,
  ): Promise<void> {
    return this.admin.setPassword(id, dto.password, asker(actor));
  }

  @Delete(':id')
  @RequirePermissions('users.manage')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Da de baja la cuenta con todo lo suyo',
    description:
      'Si es dueña de alguna iglesia, exige `churchDecisions` con una entrada por cada una ' +
      '(RFC 0015); si falta alguna, responde 409 con el impacto en `data.ownedChurches`.',
  })
  @ApiNoContentResponse()
  remove(
    @Param('id') id: string,
    @Body() dto: RemoveUserDto,
    @CurrentUser() actor: AuthUser,
  ): Promise<void> {
    return this.admin.remove(id, asker(actor), dto.churchDecisions ?? []);
  }
}

/** Lo mínimo del usuario que necesitan el alcance y el servicio. */
const asker = (user: AuthUser) => ({ id: user.id, role: user.role ?? DEFAULT_ROLE });
