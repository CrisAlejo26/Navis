import { IntersectionType } from '@nestjs/swagger';

import { ExportSelectionDto } from '../../common/dto/export-query.dto';
import { DreamsQueryDto } from './dreams-query.dto';

/**
 * Lo que acepta `GET /dreams/export` (RFC 0009 §6.1): los mismos filtros que el
 * listado, más la selección. Se cruzan y no se reescriben: dos formas de
 * filtrar lo mismo acaban filtrando distinto.
 */
export class DreamsExportQueryDto extends IntersectionType(DreamsQueryDto, ExportSelectionDto) {}
