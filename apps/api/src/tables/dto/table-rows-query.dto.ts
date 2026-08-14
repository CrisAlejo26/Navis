import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

/**
 * `GET /tables/:id/rows`: página, búsqueda, orden y filtros (RFC 0021 D30).
 *
 * `sort` es la `key` de una columna, no un campo fijo: no se puede validar con
 * `IsIn` porque las columnas de cada tabla son distintas. El servicio la
 * comprueba contra las columnas reales y devuelve 400 si no existe.
 */
export class TableRowsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'La key de una columna; sin ella, por fecha de creación' })
  @IsOptional()
  @IsString()
  @Length(1, 80)
  sort?: string;

  @ApiPropertyOptional({ description: 'RowFilter[] codificado en JSON' })
  @IsOptional()
  @IsString()
  filters?: string;
}
