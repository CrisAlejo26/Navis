import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MAX_CUSTOM_ROLE_LEVEL } from '@navis/shared';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';

const trimmed = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

/** Alta de un rol propio. El identificador lo deriva el servidor del nombre. */
export class CreateRoleDto {
  @ApiProperty({ example: 'Equipo de alabanza' })
  @IsString()
  @Length(2, 60)
  @Transform(trimmed)
  name: string;

  @ApiPropertyOptional({ example: 'Lleva la música de las reuniones' })
  @IsOptional()
  @IsString()
  @Length(0, 200)
  @Transform(trimmed)
  description?: string;

  @ApiProperty({
    minimum: 0,
    maximum: MAX_CUSTOM_ROLE_LEVEL,
    description: 'Posición en la jerarquía. Un rol propio nunca llega a administrador',
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(MAX_CUSTOM_ROLE_LEVEL)
  level: number;
}
