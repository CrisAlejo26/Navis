import { IntersectionType } from '@nestjs/swagger';

import { ExportSelectionDto } from '../../common/dto/export-query.dto';
import { BelieversQueryDto } from './believers-query.dto';

/**
 * Lo que acepta `GET /believers/export` (RFC 0009 §6.1): **los mismos filtros
 * que el listado**, más la selección.
 *
 * Se cruza con `IntersectionType` y no se reescribe: dos formas de filtrar lo
 * mismo acaban filtrando distinto, y el día que se añada un filtro al listado
 * la exportación tiene que enterarse sola.
 *
 * `page` y `limit` se heredan de `PaginationQueryDto` y aquí no significan
 * nada: la exportación no pagina, corta en `EXPORT_MAX_ROWS` y lo dice.
 */
export class BelieversExportQueryDto extends IntersectionType(
  BelieversQueryDto,
  ExportSelectionDto,
) {}
