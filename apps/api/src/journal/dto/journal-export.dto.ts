import { IntersectionType } from '@nestjs/swagger';

import { ExportSelectionDto } from '../../common/dto/export-query.dto';
import { JournalQueryDto } from './journal-query.dto';

/**
 * Lo que acepta `GET /journal/export`: los mismos filtros que el listado, más
 * la selección (D12). Se cruzan y no se reescriben: dos formas de filtrar lo
 * mismo acaban filtrando distinto.
 */
export class JournalExportQueryDto extends IntersectionType(JournalQueryDto, ExportSelectionDto) {}
