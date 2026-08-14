import { ApiProperty } from '@nestjs/swagger';
import { IsObject } from 'class-validator';

/**
 * `data` no se valida columna a columna aquí: su forma depende de las
 * columnas de **esa** tabla, que el DTO no conoce (Regla 10 — es justo el caso
 * de `Record<string, unknown>`). La comprobación real la hace el servicio,
 * con `rowValueMatchesType` contra las columnas activas.
 */
export class CreateTableRowDto {
  @ApiProperty({ description: '{ [columnKey]: valor }' })
  @IsObject()
  data: Record<string, unknown>;
}

/** Un `PATCH` es una fusión: las claves que no vienen conservan su valor. */
export class UpdateTableRowDto extends CreateTableRowDto {}
