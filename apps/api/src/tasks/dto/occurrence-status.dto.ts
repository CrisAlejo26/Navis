import { ApiProperty } from '@nestjs/swagger';
import { HABIT_STATUSES, TASK_STATUSES } from '@navis/shared';
import { IsIn } from 'class-validator';

/** `PUT /tasks/:id/occurrences/:date` (§8.1). */
export class SetTaskOccurrenceStatusDto {
  @ApiProperty({ enum: TASK_STATUSES })
  @IsIn(TASK_STATUSES)
  status: (typeof TASK_STATUSES)[number];
}

/** `PUT /habits/:id/occurrences/:date`, con los dos estados de D5. */
export class SetHabitOccurrenceStatusDto {
  @ApiProperty({ enum: HABIT_STATUSES })
  @IsIn(HABIT_STATUSES)
  status: (typeof HABIT_STATUSES)[number];
}
