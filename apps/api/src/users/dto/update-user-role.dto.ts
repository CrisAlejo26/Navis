import { ApiProperty } from '@nestjs/swagger';
import type { RoleSlug } from '@navis/shared';

import { IsRoleSlug } from '../../common/dto/role-slug.decorator';

export class UpdateUserRoleDto {
  @ApiProperty({ description: 'Rol que pasa a tener el usuario', example: 'pastor' })
  @IsRoleSlug()
  role: RoleSlug;
}
