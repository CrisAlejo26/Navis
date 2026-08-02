import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, Length, Matches } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: '+34 600 000 000' })
  @IsOptional()
  @IsString()
  @Matches(/^[+\d][\d\s().-]{5,24}$/, { message: 'Teléfono no válido' })
  phone?: string;

  @ApiPropertyOptional({ example: 'Iglesia Evangélica de Madrid' })
  @IsOptional()
  @IsString()
  @Length(2, 160)
  church?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/avatar.png' })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  avatarUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 500)
  bio?: string;

  @ApiPropertyOptional({ example: 'Europe/Madrid' })
  @IsOptional()
  @IsString()
  @Length(3, 64)
  timezone?: string;
}
