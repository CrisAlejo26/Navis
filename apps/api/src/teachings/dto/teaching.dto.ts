import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsISO8601, IsObject, IsString, Length } from 'class-validator';

const trimmed = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

/**
 * `body` no se valida nodo a nodo aquí: es un árbol recursivo y class-validator
 * no lo expresa bien (Regla 10, el mismo caso que `CreateTableRowDto`). Se
 * comprueba contra `teachingBodySchema` en el servicio, que es quien conoce
 * el whitelist entero.
 */
export class CreateTeachingDto {
  @ApiProperty({ example: 'Lo que aprendí de la corrección del domingo' })
  @IsString()
  @Length(1, 200)
  @Transform(trimmed)
  title: string;

  @ApiProperty({ description: 'El documento del editor, validado contra el whitelist' })
  @IsObject()
  body: Record<string, unknown>;

  @ApiProperty({ description: 'Cuándo se recibió', example: '2026-03-14' })
  @IsISO8601({ strict: true })
  @Length(10, 10)
  receivedAt: string;
}

export class UpdateTeachingDto extends PartialType(CreateTeachingDto) {}
