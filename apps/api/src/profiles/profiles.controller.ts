import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import type { AuthUser } from '../auth/auth';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Profile } from './profile.entity';
import { ProfilesService } from './profiles.service';

@ApiTags('perfil')
@Controller('me/profile')
export class ProfilesController {
  constructor(private readonly profiles: ProfilesService) {}

  @Get()
  @ApiOperation({ summary: 'Perfil del usuario autenticado' })
  @ApiOkResponse({ type: Profile })
  get(@CurrentUser() user: AuthUser): Promise<Profile> {
    return this.profiles.findOrCreate(user.id);
  }

  @Patch()
  @ApiOperation({ summary: 'Actualiza el perfil del usuario autenticado' })
  @ApiOkResponse({ type: Profile })
  update(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto): Promise<Profile> {
    return this.profiles.update(user.id, dto);
  }
}
