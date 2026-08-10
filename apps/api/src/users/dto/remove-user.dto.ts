import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ChurchDecision } from '@navis/shared';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsIn, IsOptional, IsUUID, ValidateNested } from 'class-validator';

/**
 * Qué hacer con una iglesia propia al dar de baja a quien la dirige (RFC
 * 0015). `targetChurchId` solo se valida como UUID; que exista, que se
 * llegue a él y que no sea el propio origen lo comprueba el servicio, que es
 * quien conoce el alcance de quien pregunta.
 */
export class ChurchDecisionDto implements ChurchDecision {
  @ApiProperty()
  @IsUUID()
  churchId: string;

  @ApiProperty({ enum: ['delete', 'transfer'] })
  @IsIn(['delete', 'transfer'])
  action: 'delete' | 'transfer';

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  targetChurchId?: string;
}

/**
 * Cuerpo del `DELETE` de una cuenta. Vacío para quien no es dueño de ninguna
 * iglesia; con una decisión por cada una para quien sí lo es, o el servicio
 * responde con un 409 en vez de borrar nada (D2).
 */
export class RemoveUserDto {
  @ApiPropertyOptional({ type: [ChurchDecisionDto] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ChurchDecisionDto)
  churchDecisions?: ChurchDecisionDto[];
}
