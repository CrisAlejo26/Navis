import { ApiPropertyOptional } from '@nestjs/swagger';
import { MAX_CUSTOM_ROLE_LEVEL } from '@navis/shared';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';

const trimmed = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

/** De un rol de serie solo se admite la descripción (ver RolesService). */
export class UpdateRoleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 60)
  @Transform(trimmed)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 200)
  @Transform(trimmed)
  description?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: MAX_CUSTOM_ROLE_LEVEL })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(MAX_CUSTOM_ROLE_LEVEL)
  level?: number;
}
