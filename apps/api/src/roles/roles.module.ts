import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RoleAdminService } from './role-admin.service';
import { Role } from './role.entity';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';

/**
 * El alta y la edición van por el repositorio de TypeORM; el listado, en
 * cambio, necesita contar cuentas de la tabla `user`, que es de Better Auth, y
 * para eso consulta el DataSource directamente.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Role])],
  controllers: [RolesController],
  providers: [RolesService, RoleAdminService],
  exports: [RolesService, RoleAdminService],
})
export class RolesModule {}
