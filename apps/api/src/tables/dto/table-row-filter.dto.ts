import { ApiProperty } from '@nestjs/swagger';
import { FILTER_OPERATORS, type FilterOperator } from '@navis/shared';
import { Allow, IsIn, IsString, Length } from 'class-validator';

/**
 * Un filtro sobre una columna real de la tabla, dentro de una vista guardada
 * (D28, D30). `value` no se tipa aquí: su forma depende del operador y del
 * tipo de la columna, y eso se valida en el servicio contra las columnas
 * reales de esa tabla.
 *
 * `@Allow()` no es decorativo: sin **algún** decorador de validación en la
 * propiedad, la whitelist global del ValidationPipe la tira como propiedad
 * que no existe — y un `between` llegaría siempre sin su `value`.
 */
export class RowFilterDto {
    @ApiProperty()
    @IsString()
    @Length(1, 80)
    columnKey: string;

    @ApiProperty({ enum: FILTER_OPERATORS })
    @IsIn(FILTER_OPERATORS)
    operator: FilterOperator;

    @ApiProperty()
    @Allow()
    value: unknown;
}
