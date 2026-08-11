import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  DEFAULT_JOURNAL_SORT,
  DEFAULT_JOURNAL_WINDOW,
  ENTRY_KINDS,
  JOURNAL_SORT_FIELDS,
  JOURNAL_WINDOWS,
  type EntryKind,
  type JournalSortField,
  type JournalWindow,
} from '@navis/shared';
import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsIn, IsISO8601, IsOptional, Length } from 'class-validator';

import { commaList } from '../../common/dto/comma-list';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

/** Filtros del listado del cuaderno (RFC 0017 §6.1). */
export class JournalQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ENTRY_KINDS, isArray: true })
  @IsOptional()
  @Transform(commaList)
  @IsArray()
  @IsIn(ENTRY_KINDS, { each: true })
  kind?: EntryKind[];

  @ApiPropertyOptional({ enum: JOURNAL_WINDOWS, default: DEFAULT_JOURNAL_WINDOW })
  @IsOptional()
  @IsIn(JOURNAL_WINDOWS)
  window: JournalWindow = DEFAULT_JOURNAL_WINDOW;

  @ApiPropertyOptional({
    description: 'Ventana a medida, si `window` no llega',
    example: '2026-01-01',
  })
  @IsOptional()
  @IsISO8601({ strict: true })
  @Length(10, 10)
  from?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsISO8601({ strict: true })
  @Length(10, 10)
  to?: string;

  @ApiPropertyOptional({ description: 'Solo entradas con recordatorio sin atender' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => value === 'true' || value === true)
  @IsBoolean()
  pendingReminder?: boolean;

  @ApiPropertyOptional({ enum: JOURNAL_SORT_FIELDS, default: DEFAULT_JOURNAL_SORT })
  @IsOptional()
  @IsIn(JOURNAL_SORT_FIELDS)
  sort: JournalSortField = DEFAULT_JOURNAL_SORT;
}
