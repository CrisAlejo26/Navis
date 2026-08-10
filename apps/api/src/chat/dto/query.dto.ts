import { ApiPropertyOptional } from '@nestjs/swagger';
import { MESSAGES_PAGE_SIZE } from '@navis/shared';
import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ChannelsQueryDto {
  @ApiPropertyOptional({ description: 'Ver los archivados en vez de la bandeja normal' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => value === 'true' || value === true)
  @IsBoolean()
  archived?: boolean;
}

/** El historial se lee de atrás hacia adelante: `before` es el cursor, nunca `page` (§3). */
export class MessagesQueryDto {
  @ApiPropertyOptional({ description: 'El `createdAt` del mensaje más antiguo ya cargado' })
  @IsOptional()
  @IsString()
  before?: string;

  @ApiPropertyOptional({ default: MESSAGES_PAGE_SIZE })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit = MESSAGES_PAGE_SIZE;
}
