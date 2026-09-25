import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsObject, IsOptional, IsUUID } from 'class-validator';

/**
 * `data` no se valida columna a columna aquí: su forma depende de las
 * columnas de **esa** tabla, que el DTO no conoce (Regla 10 - es justo el caso
 * de `Record<string, unknown>`). La comprobación real la hace el servicio,
 * con `rowValueMatchesType` contra las columnas activas.
 */
export class CreateTableRowDto {
    @ApiProperty({ description: '{ [columnKey]: valor }' })
    @IsObject()
    data: Record<string, unknown>;

    @ApiPropertyOptional({
        description: 'Exigido si la tabla está enlazada a creyentes (RFC 0025 D13)',
    })
    @IsOptional()
    @IsUUID()
    believerId?: string;
}

/** Un `PATCH` es una fusión: las claves que no vienen conservan su valor. */
export class UpdateTableRowDto extends CreateTableRowDto {}

/** Añadir creyentes en lote (RFC 0025 D7). */
export class AddTableBelieversDto {
    @ApiProperty({ type: [String] })
    @ArrayMinSize(1)
    @ArrayMaxSize(200)
    @IsUUID(undefined, { each: true })
    believerIds: string[];
}
