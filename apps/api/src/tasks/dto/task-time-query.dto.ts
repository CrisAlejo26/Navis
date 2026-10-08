import { ApiProperty } from '@nestjs/swagger';
import { IsISO8601 } from 'class-validator';

/** `GET /tasks/time/summary`: el rango en días de la iglesia, ambos extremos incluidos. */
export class TaskTimeSummaryQueryDto {
    @ApiProperty({ example: '2026-10-05' })
    @IsISO8601({ strict: true })
    from: string;

    @ApiProperty({ example: '2026-10-11' })
    @IsISO8601({ strict: true })
    to: string;
}
