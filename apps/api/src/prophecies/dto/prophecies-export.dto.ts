import { IntersectionType } from '@nestjs/swagger';

import { ExportSelectionDto } from '../../common/dto/export-query.dto';
import { PropheciesQueryDto } from './prophecies-query.dto';

/**
 * Lo que acepta `GET /prophecies/export` (RFC 0009 §6.1): los mismos filtros
 * que el listado, más la selección. Se cruzan y no se reescriben: dos formas
 * de filtrar lo mismo acaban filtrando distinto.
 */
export class PropheciesExportQueryDto extends IntersectionType(
  PropheciesQueryDto,
  ExportSelectionDto,
) {}
