import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

/** La iglesia sobre la que se pasa a trabajar. */
export class SetActiveChurchDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  churchId: string;
}
