import { Module } from '@nestjs/common';

import { ChurchesModule } from '../churches/churches.module';
import { RolesModule } from '../roles/roles.module';
import { UserAdminService } from './user-admin.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  // El alcance de quién administra a quién sale de las iglesias compartidas.
  imports: [RolesModule, ChurchesModule],
  controllers: [UsersController],
  providers: [UsersService, UserAdminService],
  exports: [UsersService, UserAdminService],
})
export class UsersModule {}
