import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsOptional, IsUUID } from 'class-validator';

import { commaList } from './comma-list';

/**
 * La selección de filas de la pantalla (RFC 0009 D1).
 *
 * Va aparte del filtro de cada módulo porque es lo único que comparten los
 * tres, y se junta con el suyo con `IntersectionType`: así cada exportación
 * acepta **sus** filtros más esto, sin que ninguno tenga que redeclararlos.
 *
 * Cuando vienen identificadores, mandan y el resto de filtros se ignora. Y van
 * validados como UUID por lo de siempre: un `IN ('')` contra una columna
 * `uuid` revienta en Postgres y a SQLite le da igual (CLAUDE.md).
 */
export class ExportSelectionDto {
  @ApiPropertyOptional({
    type: [String],
    description: 'Solo estas filas. Si vienen, manda la selección sobre los filtros',
  })
  @IsOptional()
  @Transform(commaList)
  @IsArray()
  @IsUUID(undefined, { each: true })
  ids?: string[];
}
