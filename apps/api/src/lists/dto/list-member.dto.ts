import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';

const trimmed = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class AddListMembersDto {
  @ApiProperty({ type: [String], description: 'Los marcados en el listado de creyentes' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @IsUUID(undefined, { each: true })
  believerIds: string[];
}

export class UpdateListMemberDto {
  @ApiPropertyOptional({ example: 'Solo primer domingo' })
  @IsOptional()
  @IsString()
  @Length(0, 120)
  @Transform(trimmed)
  note?: string;
}

/**
 * **El orden entero**, no «sube uno» (§7.1): movimientos relativos lanzados
 * desde dos pantallas a la vez acaban en un orden que no es el de nadie.
 */
export class ReorderListDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMaxSize(500)
  @IsUUID(undefined, { each: true })
  believerIds: string[];
}
