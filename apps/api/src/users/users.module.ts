import { Module } from '@nestjs/common';

import { RolesModule } from '../roles/roles.module';
import { UserAdminService } from './user-admin.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [RolesModule],
  controllers: [UsersController],
  providers: [UsersService, UserAdminService],
  exports: [UsersService, UserAdminService],
})
export class UsersModule {}
