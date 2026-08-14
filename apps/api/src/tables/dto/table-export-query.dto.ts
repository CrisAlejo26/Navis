import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBooleanString, IsOptional, IsString } from 'class-validator';

/**
 * `GET /tables/:id/export`: la vista y los filtros activos, más si se incluyen
 * las contraseñas en claro (RFC 0021 D23).
 */
export class TableExportQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'RowFilter[] codificado en JSON' })
  @IsOptional()
  @IsString()
  filters?: string;

  @ApiPropertyOptional({ description: 'Solo tras el aviso explícito de la interfaz (D23)' })
  @IsOptional()
  @IsBooleanString()
  includePasswords?: string;
}
