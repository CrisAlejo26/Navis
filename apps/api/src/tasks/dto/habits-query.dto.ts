import { ApiPropertyOptional } from '@nestjs/swagger';
import { DEFAULT_PAGE_SIZE, HABIT_SORTS, MAX_PAGE_SIZE, type HabitSort } from '@navis/shared';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';

import { commaList } from '../../common/dto/comma-list';

const booleano = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value === 'true' : value;

/** `GET /habits`, igual que `TasksQueryDto`. */
export class HabitsQueryDto {
  @ApiPropertyOptional({ example: '2026-08-01' })
  @IsOptional()
  @IsISO8601({ strict: true })
  from?: string;

  @ApiPropertyOptional({ example: '2026-08-31' })
  @IsOptional()
  @IsISO8601({ strict: true })
  to?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: DEFAULT_PAGE_SIZE, maximum: MAX_PAGE_SIZE })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  limit: number = DEFAULT_PAGE_SIZE;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 120)
  search?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @Transform(commaList)
  @IsArray()
  @IsUUID('all', { each: true })
  tag?: string[];

  @ApiPropertyOptional({ enum: ['with', 'without'] })
  @IsOptional()
  @IsIn(['with', 'without'])
  reminder?: 'with' | 'without';

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @Transform(booleano)
  hideCompleted: boolean = true;

  @ApiPropertyOptional({ enum: HABIT_SORTS })
  @IsOptional()
  @IsIn(HABIT_SORTS)
  sort?: HabitSort;
}
