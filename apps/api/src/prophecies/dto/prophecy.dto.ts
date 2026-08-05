import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsISO8601, IsOptional, IsString, Length, ValidateIf } from 'class-validator';

const trimmed = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

/**
 * Una palabra recibida (RFC 0004 §6.3).
 *
 * Que la fecha de cumplimiento no sea anterior a la de recepción (D7) se
 * comprueba en el servicio: al editar puede llegar solo una de las dos, y aquí
 * no se tiene delante la fila entera.
 */
export class CreateProphecyDto {
  @ApiProperty({ example: 'La casa' })
  @IsString()
  @Length(1, 200)
  @Transform(trimmed)
  title: string;

  @ApiProperty({ description: 'La palabra, entera. Texto plano' })
  @IsString()
  @Length(1, 20000)
  @Transform(trimmed)
  body: string;

  @ApiProperty({ description: 'Cuándo se recibió', example: '2026-03-14' })
  @IsISO8601({ strict: true })
  @Length(10, 10)
  receivedAt: string;

  /** Al crear no tiene sentido mandar `null`: o hay fecha, o no se manda. */
  @ApiPropertyOptional({ description: 'Cuándo se acabó de cumplir, si ya se cumplió' })
  @IsOptional()
  @IsISO8601({ strict: true })
  @Length(10, 10)
  fulfilledAt?: string;
}

/**
 * Al editar, `fulfilledAt` acepta además `null`, que **sí** significa algo:
 * quitar la fecha reabre la profecía y la devuelve a su estado anterior (D6).
 *
 * Se saca del tipo heredado en vez de redeclararla encima: ensanchar una
 * propiedad de la clase base no lo permite TypeScript, y con razón.
 */
export class UpdateProphecyDto extends PartialType(
  OmitType(CreateProphecyDto, ['fulfilledAt'] as const),
) {
  @ApiPropertyOptional({ description: '`null` la reabre (D6)', nullable: true })
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsISO8601({ strict: true })
  @Length(10, 10)
  fulfilledAt?: string | null;
}

/** Un cumplimiento parcial: qué parte se cumplió y cuándo (D4). */
export class CreateFulfillmentDto {
  @ApiProperty({ description: 'Qué parte se ha cumplido' })
  @IsString()
  @Length(1, 4000)
  @Transform(trimmed)
  text: string;

  @ApiProperty({ example: '2026-07-14' })
  @IsISO8601({ strict: true })
  @Length(10, 10)
  occurredAt: string;
}

export class UpdateFulfillmentDto extends PartialType(CreateFulfillmentDto) {}
